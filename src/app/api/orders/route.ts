import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { sendOrderConfirmationEmail } from "@/lib/email"

export async function GET() {
  try {
    // Get authenticated user
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        address: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const transformedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      trackingCode: order.trackingCode,
      status: order.status.toLowerCase(),
      subtotal: Number(order.subtotal),
      shipping: Number(order.shipping),
      total: Number(order.total),
      paymentMethod: order.paymentMethod,
      notes: order.notes,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      shippingAddress: `${order.address.address}, ${order.address.city}`,
      items: order.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        brand: item.product.id,
        price: Number(item.price),
        quantity: item.quantity,
        image: item.product.images[0] || "",
        customImage: item.customImage || null,
      })),
    }))

    return NextResponse.json(transformedOrders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
      { error: "Error fetching orders" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Generate order number
    const orderCount = await prisma.order.count()
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, "0")}`

    const order = await prisma.order.create({
      data: {
        orderNumber,
        status: "CONFIRMED",
        subtotal: body.subtotal,
        shipping: body.shipping,
        total: body.total,
        paymentMethod: body.paymentMethod || "CARD",
        stripeSessionId: body.transactionId,
        notes: body.notes,
        userId: session.user.id,
        addressId: body.addressId,
        items: {
          create: (body.items || []).map((item: {
            productId: string
            name: string
            price: number
            quantity: number
            customImage?: string
          }) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity,
            productId: item.productId,
            customImage: item.customImage || null,
          })),
        },
      },
      include: {
        items: true,
        address: true,
      },
    })

    // Send confirmation email — fetch user email separately (not in order include)
    const userRecord = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    })

    if (userRecord) {
      await sendOrderConfirmationEmail({
        to: userRecord.email,
        customerName: userRecord.name,
        orderNumber: order.orderNumber,
        orderTotal: Number(order.total),
        orderItems: (body.items || []).map((item: {
          name: string; price: number; quantity: number
        }) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        paymentMethod: body.paymentMethod || "Webpay",
      })
    }

    return NextResponse.json(
      {
        id: order.id,
        orderNumber: order.orderNumber,
        trackingCode: order.trackingCode,
        status: order.status,
        total: Number(order.total),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json(
      { error: "Error creating order" },
      { status: 500 }
    )
  }
}
