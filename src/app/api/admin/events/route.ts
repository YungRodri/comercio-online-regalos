import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"

export async function GET() {
  // Public read — shop can show active events
  try {
    const events = await prisma.event.findMany({
      orderBy: { startDate: "asc" },
    })
    return NextResponse.json(events)
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json(
      { error: "Error al obtener los eventos" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()

    if (!body.title || !body.startDate) {
      return NextResponse.json(
        { error: "El título y la fecha de inicio son requeridos" },
        { status: 400 }
      )
    }

    const event = await prisma.event.create({
      data: {
        title: String(body.title).trim(),
        description: body.description ? String(body.description).trim() : null,
        imageUrl: body.imageUrl || null,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        isActive: body.isActive !== false,
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json(
      { error: "Error al crear el evento" },
      { status: 500 }
    )
  }
}
