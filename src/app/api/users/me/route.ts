import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true, avatar: true },
  })

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  }

  return NextResponse.json(user)
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length < 2) {
        return NextResponse.json(
          { error: "El nombre debe tener al menos 2 caracteres" },
          { status: 400 }
        )
      }
      updates.name = body.name.trim()
    }

    if (body.phone !== undefined) {
      updates.phone = body.phone?.trim() || null
    }

    if (body.newPassword !== undefined) {
      if (!body.currentPassword) {
        return NextResponse.json(
          { error: "Se requiere la contraseña actual para cambiarla" },
          { status: 400 }
        )
      }
      if (typeof body.newPassword !== "string" || body.newPassword.length < 8) {
        return NextResponse.json(
          { error: "La nueva contraseña debe tener al menos 8 caracteres" },
          { status: 400 }
        )
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { password: true },
      })

      const passwordMatch = await bcrypt.compare(
        body.currentPassword as string,
        user?.password ?? ""
      )
      if (!passwordMatch) {
        return NextResponse.json(
          { error: "La contraseña actual es incorrecta" },
          { status: 400 }
        )
      }

      updates.password = await bcrypt.hash(body.newPassword as string, 10)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No hay datos para actualizar" }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updates,
      select: { id: true, name: true, email: true, phone: true },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Error al actualizar el perfil" }, { status: 500 })
  }
}
