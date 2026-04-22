import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  // Rate limit: max 5 register attempts per IP per 15 minutes
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  const rl = checkRateLimit(`register:${ip}`, { limit: 5, windowSec: 900 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Por favor, espera antes de volver a intentarlo." },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfter) },
      }
    )
  }

  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, email y contraseña son requeridos" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error registering user:", error)
    return NextResponse.json(
      { error: "Error al registrar usuario" },
      { status: 500 }
    )
  }
}
