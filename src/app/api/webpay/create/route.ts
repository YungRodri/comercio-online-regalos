import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createWebpayTransaction } from "@/lib/webpay"

interface CartItemInput {
  id: string
  name?: string
  quantity: number
  customImage?: string | null
}

interface WebpayCheckoutBody {
  items: CartItemInput[]
  addressId?: string
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para pagar con Webpay" },
        { status: 401 }
      )
    }

    const body: WebpayCheckoutBody = await request.json()
    const items = body.items || []

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "No hay productos para pagar" },
        { status: 400 }
      )
    }

    // Security: fetch products from DB to prevent client-side price tampering
    const itemIds = items.map((item) => item.id)
    const dbProducts = await prisma.product.findMany({
      where: {
        id: { in: itemIds },
        isActive: true,
      },
    })

    const productMap = new Map(dbProducts.map((p) => [p.id, p]))

    for (const item of items) {
      const dbProd = productMap.get(item.id)
      if (!dbProd) {
        return NextResponse.json(
          { error: "Uno o más productos ya no están disponibles" },
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

    // Recalculate verified subtotal and shipping
    const subtotal = items.reduce((acc, item) => {
      const dbProd = productMap.get(item.id)!
      return acc + Math.round(Number(dbProd.price)) * item.quantity
    }, 0)

    const shipping = subtotal >= 50000 ? 0 : 3990
    const total = subtotal + shipping

    if (total <= 0) {
      return NextResponse.json(
        { error: "El monto total debe ser mayor a cero" },
        { status: 400 }
      )
    }

    // Resolve customer shipping address
    let addressId = body.addressId
    if (!addressId) {
      const existingAddress = await prisma.address.findFirst({
        where: { userId: session.user.id },
        orderBy: { isDefault: "desc" },
      })

      if (existingAddress) {
        addressId = existingAddress.id
      } else {
        const user = await prisma.user.findUnique({ where: { id: session.user.id } })
        const createdAddress = await prisma.address.create({
          data: {
            userId: session.user.id,
            label: "Envío",
            name: user?.name || "Cliente",
            phone: user?.phone || "+56 9 0000 0000",
            address: "Dirección registrada al pagar",
            city: "Santiago",
            state: "Región Metropolitana",
            zipCode: "0000000",
            isDefault: true,
          },
        })
        addressId = createdAddress.id
      }
    }

    // Generate Transbank-compliant buy_order (max 26 chars, alphanumeric)
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
    const buyOrder = `WP${Date.now().toString().slice(-10)}${suffix}`
    const sessionId = session.user.id

    // Human-friendly order number
    const orderCount = await prisma.order.count()
    const orderNumber = `WP-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, "0")}`

    // Persist pending order before redirecting to payment gateway
    await prisma.order.create({
      data: {
        orderNumber,
        status: "PENDING",
        subtotal,
        shipping,
        discount: 0,
        total,
        paymentMethod: "Webpay",
        stripeSessionId: buyOrder, // buyOrder is stored in this transaction identifier column
        notes: body.notes || null,
        userId: session.user.id,
        addressId,
        items: {
          create: items.map((item) => {
            const dbProd = productMap.get(item.id)!
            const unitPrice = Math.round(Number(dbProd.price))
            return {
              productId: item.id,
              name: dbProd.name,
              price: unitPrice,
              quantity: item.quantity,
              total: unitPrice * item.quantity,
              customImage: item.customImage || null,
            }
          }),
        },
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const webpaySession = await createWebpayTransaction({
      buy_order: buyOrder,
      session_id: sessionId,
      amount: total,
      return_url: `${appUrl}/api/webpay/commit`,
    })

    return NextResponse.json({
      provider: "webpay",
      buyOrder,
      orderNumber,
      amount: total,
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
