import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { z } from "zod"

const checkoutBodySchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      quantity: z.coerce.number().int().positive().max(50),
    })
  ).min(1).max(100),
  couponCode: z.string().trim().max(64).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para realizar una compra" },
        { status: 401 }
      )
    }

    const rl = checkRateLimit(`checkout:${session.user.id}`, {
      limit: 20,
      windowSec: 60,
    })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta nuevamente en unos segundos." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      )
    }

    const parsed = checkoutBodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos de checkout inválidos" }, { status: 400 })
    }
    const { items, couponCode, metadata } = parsed.data

    const productIds = [...new Set(items.map((item) => item.id))]
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, name: true, price: true, stock: true, images: true },
    })
    const productsById = new Map(products.map((product) => [product.id, product]))

    if (productsById.size !== productIds.length) {
      return NextResponse.json({ error: "El carrito contiene productos inválidos" }, { status: 400 })
    }

    const normalizedItems = items.map((item) => {
      const product = productsById.get(item.id)
      if (!product) {
        throw new Error("Producto inválido en carrito")
      }
      return {
        id: item.id,
        quantity: item.quantity,
        name: product.name,
        unitPrice: Number(product.price),
        image: product.images[0] || undefined,
        stock: product.stock,
      }
    })

    const itemWithoutStock = normalizedItems.find((item) => item.quantity > item.stock)
    if (itemWithoutStock) {
      return NextResponse.json(
        { error: `Stock insuficiente para ${itemWithoutStock.name}` },
        { status: 400 }
      )
    }

    const subtotal = normalizedItems.reduce(
      (acc, item) => acc + item.unitPrice * item.quantity,
      0
    )

    // Create line items for Stripe from server-side prices
    const lineItems = normalizedItems.map((item) => ({
      price_data: {
        currency: "pen", // Peruvian Sol
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.unitPrice * 100), // Stripe uses cents
      },
      quantity: item.quantity,
    }))

    // Calculate subtotal for free shipping check
    const qualifiesForFreeShipping = subtotal >= 200

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
        discountAmount = Math.round(discountAmount * 100) / 100
      }
    }

    // Build shipping options based on subtotal
    const shippingOptions = qualifiesForFreeShipping
      ? [
          {
            shipping_rate_data: {
              type: "fixed_amount" as const,
              fixed_amount: {
                amount: 0,
                currency: "pen",
              },
              display_name: "Envio gratis",
              delivery_estimate: {
                minimum: { unit: "business_day" as const, value: 3 },
                maximum: { unit: "business_day" as const, value: 5 },
              },
            },
          },
          {
            shipping_rate_data: {
              type: "fixed_amount" as const,
              fixed_amount: {
                amount: 1500, // $ 15.00
                currency: "pen",
              },
              display_name: "Envio express",
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
                amount: 1500, // $ 15.00
                currency: "pen",
              },
              display_name: "Envio estandar",
              delivery_estimate: {
                minimum: { unit: "business_day" as const, value: 3 },
                maximum: { unit: "business_day" as const, value: 5 },
              },
            },
          },
          {
            shipping_rate_data: {
              type: "fixed_amount" as const,
              fixed_amount: {
                amount: 3000, // $ 30.00
                currency: "pen",
              },
              display_name: "Envio express",
              delivery_estimate: {
                minimum: { unit: "business_day" as const, value: 1 },
                maximum: { unit: "business_day" as const, value: 2 },
              },
            },
          },
        ]

    // Create Stripe checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
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
        // Use empty string as sentinel for "no coupon" since Stripe metadata values must be strings
        couponId: couponId ?? "",
        discountAmount: String(discountAmount),
        items: JSON.stringify(normalizedItems.map((i) => ({ id: i.id, qty: i.quantity }))),
      },
      shipping_options: shippingOptions,
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["PE"],
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
      { error: "Error creating checkout session" },
      { status: 500 }
    )
  }
}
