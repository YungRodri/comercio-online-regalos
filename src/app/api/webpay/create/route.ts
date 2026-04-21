import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createWebpayTransaction } from "@/lib/webpay"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface WebpayCheckoutBody {
  items: CartItem[]
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

    const invalidItem = items.find(
      (item) =>
        !item.id ||
        !item.name ||
        typeof item.price !== "number" ||
        item.price <= 0 ||
        typeof item.quantity !== "number" ||
        item.quantity <= 0
    )

    if (invalidItem) {
      return NextResponse.json(
        { error: "Hay productos inválidos en el carrito" },
        { status: 400 }
      )
    }

    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
    const amount = Math.round(total)

    if (amount <= 0) {
      return NextResponse.json(
        { error: "El monto total debe ser mayor a cero" },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const buyOrder = `BT-WP-${Date.now()}`
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

