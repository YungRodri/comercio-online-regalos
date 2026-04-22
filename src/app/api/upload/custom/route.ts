import { NextRequest, NextResponse } from "next/server"
import { cloudinary } from "@/lib/cloudinary"
import { requireAuth } from "@/lib/api-auth"

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
// Minimum bytes needed for magic byte detection (WebP header spans bytes 0-11)
const MIN_MAGIC_BYTES_LENGTH = 12

export async function POST(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      )
    }

    // Validate MIME type — only JPEG / PNG / WebP allowed
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Tipo de archivo no válido. Solo se permiten imágenes JPG, PNG o WebP",
        },
        { status: 400 }
      )
    }

    // Validate file size (max 5 MB)
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "El archivo es demasiado grande. El tamaño máximo es 5 MB" },
        { status: 400 }
      )
    }

    // Read file bytes and verify magic bytes to prevent MIME spoofing
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Require minimum 12 bytes for magic byte detection (WebP needs bytes 0-11)
    if (buffer.length < MIN_MAGIC_BYTES_LENGTH) {
      return NextResponse.json(
        { error: "El archivo es demasiado pequeño para ser una imagen válida" },
        { status: 400 }
      )
    }

    // Check magic bytes for JPEG (FF D8 FF), PNG (89 50 4E 47) and WebP (52 49 46 46 ... 57 45 42 50)
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
            "El archivo no es una imagen válida. Solo se aceptan archivos JPG, PNG o WebP reales",
        },
        { status: 400 }
      )
    }

    // Upload to Cloudinary under a dedicated "custom-products" folder
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "basictech/custom-products",
              resource_type: "image",
              transformation: [
                { width: 1200, height: 1200, crop: "limit" },
                { quality: "auto" },
                { fetch_format: "auto" },
              ],
              allowed_formats: ["jpg", "jpeg", "png", "webp"],
            },
            (err, uploadResult) => {
              if (err) reject(err)
              else
                resolve(
                  uploadResult as { secure_url: string; public_id: string }
                )
            }
          )
          .end(buffer)
      }
    )

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    })
  } catch (err) {
    console.error("Error uploading custom product image:", err)
    return NextResponse.json(
      { error: "Error al subir la imagen personalizada" },
      { status: 500 }
    )
  }
}
