import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface CartItemInput {
  id: string
  name?: string
  quantity: number
  customImage?: string
}

interface CheckoutBody {
  items: CartItemInput[]
  couponCode?: string
  customerEmail?: string
  shippingAddressId?: string
  metadata?: Record<string, string>
}

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para realizar una compra" },
        { status: 401 }
      )
    }

    const body: CheckoutBody = await request.json()
    const { items, couponCode, metadata } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "No hay productos en el carrito" },
        { status: 400 }
      )
    }

    // Security: fetch real products from DB to prevent client-side price tampering
    const itemIds = items.map((i) => i.id)
    const dbProducts = await prisma.product.findMany({
      where: {
        id: { in: itemIds },
        isActive: true,
      },
    })

    const productMap = new Map(dbProducts.map((p) => [p.id, p]))

    // Validate existence and stock
    for (const item of items) {
      const dbProd = productMap.get(item.id)
      if (!dbProd) {
        return NextResponse.json(
          { error: `El producto seleccionado no está disponible` },
          { status: 400 }
        )
      }

      if (typeof item.quantity !== "number" || item.quantity <= 0) {
        return NextResponse.json(
          { error: `Cantidad inválida para ${dbProd.name}` },
          { status: 400 }
        )
      }

      if (dbProd.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${dbProd.name}. Disponibles: ${dbProd.stock}` },
          { status: 400 }
        )
      }
    }

    // Build verified line items for Stripe (CLP is a zero-decimal currency in Stripe)
    const lineItems = items.map((item) => {
      const dbProd = productMap.get(item.id)!
      const unitPrice = Math.round(Number(dbProd.price))

      return {
        price_data: {
          currency: "clp",
          product_data: {
            name: dbProd.name,
            images: dbProd.images && dbProd.images.length > 0 ? [dbProd.images[0]] : [],
          },
          unit_amount: unitPrice,
        },
        quantity: item.quantity,
      }
    })

    // Calculate real subtotal from database prices
    const subtotal = items.reduce((acc, item) => {
      const dbProd = productMap.get(item.id)!
      return acc + Math.round(Number(dbProd.price)) * item.quantity
    }, 0)

    const qualifiesForFreeShipping = subtotal >= 50000

    // Validate coupon if provided
    let couponId: string | null = null
    let discountAmount = 0
    if (couponCode) {
      const code = couponCode.trim().toUpperCase()
      const coupon = await prisma.coupon.findUnique({ where: { code } })
      const now = new Date()

      if (
        coupon &&
        coupon.isActive &&
        now >= coupon.startsAt &&
        (coupon.expiresAt === null || now <= coupon.expiresAt) &&
        (coupon.maxUses === null || coupon.usedCount < coupon.maxUses) &&
        (coupon.minOrderValue === null || subtotal >= Number(coupon.minOrderValue))
      ) {
        couponId = coupon.id
        if (coupon.discountType === "PERCENT") {
          discountAmount = (subtotal * Number(coupon.discountValue)) / 100
        } else {
          discountAmount = Math.min(Number(coupon.discountValue), subtotal)
        }
        discountAmount = Math.round(discountAmount)
      }
    }

    // Build shipping options in CLP
    const shippingOptions = qualifiesForFreeShipping
      ? [
          {
            shipping_rate_data: {
              type: "fixed_amount" as const,
              fixed_amount: {
                amount: 0,
                currency: "clp",
              },
              display_name: "Envío gratis",
              delivery_estimate: {
                minimum: { unit: "business_day" as const, value: 2 },
                maximum: { unit: "business_day" as const, value: 4 },
              },
            },
          },
          {
            shipping_rate_data: {
              type: "fixed_amount" as const,
              fixed_amount: {
                amount: 4990,
                currency: "clp",
              },
              display_name: "Envío express",
              delivery_estimate: {
                minimum: { unit: "business_day" as const, value: 1 },
                maximum: { unit: "business_day" as const, value: 2 },
              },
            },
          },
        ]
      : [
          {
            shipping_rate_data: {
              type: "fixed_amount" as const,
              fixed_amount: {
                amount: 3990,
                currency: "clp",
              },
              display_name: "Envío estándar",
              delivery_estimate: {
                minimum: { unit: "business_day" as const, value: 2 },
                maximum: { unit: "business_day" as const, value: 4 },
              },
            },
          },
          {
            shipping_rate_data: {
              type: "fixed_amount" as const,
              fixed_amount: {
                amount: 5990,
                currency: "clp",
              },
              display_name: "Envío express",
              delivery_estimate: {
                minimum: { unit: "business_day" as const, value: 1 },
                maximum: { unit: "business_day" as const, value: 2 },
              },
            },
          },
        ]

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

    // Create Stripe checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancel`,
      customer_email: session.user.email || undefined,
      metadata: {
        ...metadata,
        userId: session.user.id,
        couponId: couponId ?? "",
        discountAmount: String(discountAmount),
        items: JSON.stringify(
          items.map((i) => ({
            id: i.id,
            qty: i.quantity,
            customImage: i.customImage || null,
          }))
        ),
      },
      shipping_options: shippingOptions,
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["CL"],
      },
    })

    return NextResponse.json({
      sessionId: stripeSession.id,
      url: stripeSession.url,
      discountAmount,
    })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json(
      { error: "Error al crear la sesión de pago con Stripe" },
      { status: 500 }
    )
  }
}
