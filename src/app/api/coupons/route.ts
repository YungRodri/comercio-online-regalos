import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"
import { writeAuditLog } from "@/lib/audit"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(
      coupons.map((c) => ({
        id: c.id,
        code: c.code,
        description: c.description,
        discountType: c.discountType,
        discountValue: Number(c.discountValue),
        minOrderValue: c.minOrderValue ? Number(c.minOrderValue) : null,
        maxUses: c.maxUses,
        usedCount: c.usedCount,
        isActive: c.isActive,
        startsAt: c.startsAt.toISOString(),
        expiresAt: c.expiresAt?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error("Error fetching coupons:", error)
    return NextResponse.json({ error: "Error fetching coupons" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()

    const coupon = await prisma.coupon.create({
      data: {
        code: (body.code as string).trim().toUpperCase(),
        description: body.description ?? null,
        discountType: body.discountType, // "PERCENT" | "FIXED"
        discountValue: body.discountValue,
        minOrderValue: body.minOrderValue ?? null,
        maxUses: body.maxUses ?? null,
        isActive: body.isActive ?? true,
        startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    })

    await writeAuditLog({
      userId: session!.user.id,
      userEmail: session!.user.email!,
      action: "CREATE",
      resource: "coupon",
      resourceId: coupon.id,
      after: coupon,
    })

    return NextResponse.json(coupon, { status: 201 })
  } catch (error) {
    console.error("Error creating coupon:", error)
    return NextResponse.json({ error: "Error creating coupon" }, { status: 500 })
  }
}
