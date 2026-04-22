import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"
import { writeAuditLog } from "@/lib/audit"

type Params = Promise<{ id: string }>

export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const { id } = await params
    const coupon = await prisma.coupon.findUnique({ where: { id } })

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    }

    return NextResponse.json(coupon)
  } catch (error) {
    console.error("Error fetching coupon:", error)
    return NextResponse.json({ error: "Error fetching coupon" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  const { session, error } = await requireAdmin()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()

    const before = await prisma.coupon.findUnique({ where: { id } })

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        code: body.code ? (body.code as string).trim().toUpperCase() : undefined,
        description: body.description,
        discountType: body.discountType,
        discountValue: body.discountValue,
        minOrderValue: body.minOrderValue ?? null,
        maxUses: body.maxUses ?? null,
        isActive: body.isActive,
        startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    })

    await writeAuditLog({
      userId: session!.user.id,
      userEmail: session!.user.email!,
      action: "UPDATE",
      resource: "coupon",
      resourceId: id,
      before,
      after: coupon,
    })

    return NextResponse.json(coupon)
  } catch (error) {
    console.error("Error updating coupon:", error)
    return NextResponse.json({ error: "Error updating coupon" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Params }
) {
  const { session, error } = await requireAdmin()
  if (error) return error

  try {
    const { id } = await params

    const before = await prisma.coupon.findUnique({ where: { id } })

    await prisma.coupon.delete({ where: { id } })

    await writeAuditLog({
      userId: session!.user.id,
      userEmail: session!.user.email!,
      action: "DELETE",
      resource: "coupon",
      resourceId: id,
      before,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting coupon:", error)
    return NextResponse.json({ error: "Error deleting coupon" }, { status: 500 })
  }
}
