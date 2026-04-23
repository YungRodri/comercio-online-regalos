import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"

type Params = Promise<{ id: string }>

export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()

    const event = await prisma.event.update({
      where: { id },
      data: {
        title: body.title ? String(body.title).trim() : undefined,
        description:
          body.description !== undefined
            ? String(body.description).trim() || null
            : undefined,
        imageUrl: body.imageUrl !== undefined ? body.imageUrl || null : undefined,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate:
          body.endDate !== undefined
            ? body.endDate
              ? new Date(body.endDate)
              : null
            : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json(
      { error: "Error al actualizar el evento" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Params }
) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const { id } = await params
    await prisma.event.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json(
      { error: "Error al eliminar el evento" },
      { status: 500 }
    )
  }
}
