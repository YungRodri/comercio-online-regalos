import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { requireAdmin, requireWorkerOrAdmin } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  // Workers can read users (to get contact info for orders) but not create/modify
  const { session, error } = await requireWorkerOrAdmin()
  if (error) return error

  const isWorker = session!.user.role === "WORKER"

  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")
    const status = searchParams.get("status")

    const where: Record<string, unknown> = {}

    if (role) {
      where.role = role.toUpperCase()
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: { orders: true },
        },
        orders: {
          select: {
            total: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const transformedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      // Workers can see email and phone (contact info), but not sensitive data
      email: user.email,
      phone: (user as { phone?: string | null }).phone ?? null,
      avatar: user.avatar,
      role: user.role.toLowerCase(),
      status: user.status.toLowerCase(),
      createdAt: user.createdAt.toISOString(),
      orders: user._count.orders,
      // Workers don't need financial totals
      totalSpent: isWorker ? 0 : user.orders.reduce((sum, order) => sum + Number(order.total), 0),
    }))

    return NextResponse.json(transformedUsers)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Error fetching users" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()

    if (!body.name || !body.email || !body.password) {
      return NextResponse.json(
        { error: "Nombre, email y contraseña son requeridos" },
        { status: 400 }
      )
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(body.password as string, 10)

    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        name: body.name,
        phone: body.phone,
        role: body.role?.toUpperCase() || "CUSTOMER",
        status: "ACTIVE",
      },
    })

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.toLowerCase(),
        status: user.status.toLowerCase(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Error creating user" },
      { status: 500 }
    )
  }
}
