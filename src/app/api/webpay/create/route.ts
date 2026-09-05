import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createWebpayTransaction } from "@/lib/webpay"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { z } from "zod"

const webpayCheckoutBodySchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      quantity: z.coerce.number().int().positive().max(50),
    })
  ).min(1).max(100),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para pagar con Webpay" },
        { status: 401 }
      )
    }

    const rl = checkRateLimit(`webpay:create:${session.user.id}`, {
      limit: 10,
      windowSec: 60,
    })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta nuevamente en unos segundos." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      )
    }

    const parsed = webpayCheckoutBodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos de checkout inválidos" }, { status: 400 })
    }
    const items = parsed.data.items

    const productIds = [...new Set(items.map((item) => item.id))]
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, name: true, price: true, stock: true },
    })
    const productsById = new Map(products.map((product) => [product.id, product]))

    if (productsById.size !== productIds.length) {
      return NextResponse.json(
        { error: "Hay productos inválidos en el carrito" },
        { status: 400 }
      )
    }

    const normalizedItems = items.map((item) => {
      const product = productsById.get(item.id)
      if (!product) {
        throw new Error("Producto inválido")
      }
      return {
        name: product.name,
        quantity: item.quantity,
        unitPrice: Number(product.price),
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

    const total = normalizedItems.reduce(
      (acc, item) => acc + item.unitPrice * item.quantity,
      0
    )
    const amount = Math.round(total)

    if (amount <= 0) {
      return NextResponse.json(
        { error: "El monto total debe ser mayor a cero" },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase()
    const buyOrder = `BT-WP-${Date.now()}-${suffix}`
    const sessionId = session.user.id

    const webpaySession = await createWebpayTransaction({
      buy_order: buyOrder,
      session_id: sessionId,
      amount,
      return_url: `${appUrl}/api/webpay/commit`,
    })

    return NextResponse.json({
      provider: "webpay",
      buyOrder,
      amount,
      token: webpaySession.token,
      url: webpaySession.url,
    })
  } catch (error) {
    console.error("Error creating Webpay transaction:", error)
    return NextResponse.json(
      { error: "No se pudo iniciar el pago con Webpay" },
      { status: 500 }
    )
  }
}
