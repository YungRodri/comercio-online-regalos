import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"

/**
 * POST /api/coupons/validate
 * Body: { code: string; orderTotal: number }
 * Returns the discount amount or an error.
 */
export async function POST(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    if (typeof body.code !== "string" || !body.code) {
      return NextResponse.json({ error: "Código de cupón requerido" }, { status: 400 })
    }
    const code = body.code.trim().toUpperCase()
    const orderTotal = Number(body.orderTotal)

    const coupon = await prisma.coupon.findUnique({ where: { code } })

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: "Cupón inválido o inactivo" }, { status: 404 })
    }

    const now = new Date()
    if (now < coupon.startsAt) {
      return NextResponse.json({ error: "Este cupón aún no está vigente" }, { status: 400 })
    }

    if (coupon.expiresAt && now > coupon.expiresAt) {
      return NextResponse.json({ error: "Este cupón ha expirado" }, { status: 400 })
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Este cupón ha alcanzado su límite de usos" }, { status: 400 })
    }

    if (coupon.minOrderValue !== null && orderTotal < Number(coupon.minOrderValue)) {
      return NextResponse.json(
        {
          error: `El pedido mínimo para este cupón es $ ${Number(coupon.minOrderValue).toLocaleString('es-CL')}`,
        },
        { status: 400 }
      )
    }

    // Calculate discount amount
    let discountAmount: number
    if (coupon.discountType === "PERCENT") {
      discountAmount = (orderTotal * Number(coupon.discountValue)) / 100
    } else {
      discountAmount = Math.min(Number(coupon.discountValue), orderTotal)
    }

    return NextResponse.json({
      couponId: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      discountAmount: Math.round(discountAmount * 100) / 100,
    })
  } catch (error) {
    console.error("Error validating coupon:", error)
    return NextResponse.json({ error: "Error validating coupon" }, { status: 500 })
  }
}
