import { NextRequest, NextResponse } from "next/server"
import { cloudinary } from "@/lib/cloudinary"
import { checkRateLimit } from "@/lib/rate-limit"

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const MIN_MAGIC_BYTES_LENGTH = 12

export async function POST(request: NextRequest) {
  // Rate limit: max 10 image uploads per IP per 10 minutes
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"

  const rl = checkRateLimit(`upload_public:${ip}`, { limit: 10, windowSec: 600 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas subidas de imágenes. Por favor, espera unos minutos." },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfter) },
      }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      )
    }

    // Validar tipo MIME reportado
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no válido. Solo se permiten imágenes (JPG, PNG, WebP)" },
        { status: 400 }
      )
    }

    // Validar tamaño (máx 5MB)
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "El archivo es demasiado grande. El límite es 5MB" },
        { status: 400 }
      )
    }

    // Convertir a buffer y verificar firma real (magic bytes)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    if (buffer.length < MIN_MAGIC_BYTES_LENGTH) {
      return NextResponse.json(
        { error: "El archivo es demasiado pequeño o está corrupto" },
        { status: 400 }
      )
    }

    // Verificación de bytes mágicos: JPEG (FF D8 FF), PNG (89 50 4E 47), WebP (RIFF....WEBP)
    const isJpeg =
      buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    const isWebp =
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50

    if (!isJpeg && !isPng && !isWebp) {
      return NextResponse.json(
        {
          error:
            "El archivo no es una imagen válida. Solo se aceptan formatos reales JPG, PNG o WebP.",
        },
        { status: 400 }
      )
    }

    // Subir a Cloudinary con transformaciones de seguridad
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "cycregalos/user_uploads",
              resource_type: "image",
              allowed_formats: ["jpg", "jpeg", "png", "webp"],
              transformation: [
                { width: 1200, height: 1200, crop: "limit" },
                { quality: "auto" },
                { fetch_format: "auto" },
              ],
            },
            (error, result) => {
              if (error) reject(error)
              else resolve(result as { secure_url: string; public_id: string })
            }
          )
          .end(buffer)
      }
    )

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    })
  } catch (error) {
    console.error("Error uploading image:", error)
    return NextResponse.json(
      { error: "Error al subir la imagen" },
      { status: 500 }
    )
  }
}
