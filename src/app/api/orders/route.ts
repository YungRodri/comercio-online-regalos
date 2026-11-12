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

    const isAdmin = session.user.role === "ADMIN"
    const body = await request.json()
    const itemsInput: Array<{
      productId: string
      quantity: number
      customImage?: string
    }> = body.items || []

    if (!Array.isArray(itemsInput) || itemsInput.length === 0) {
      return NextResponse.json(
        { error: "El pedido debe contener al menos un producto" },
        { status: 400 }
      )
    }

    // Security: fetch and verify real products from DB
    const productIds = itemsInput.map((i) => i.productId)
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    })
    const productMap = new Map(dbProducts.map((p) => [p.id, p]))

    for (const item of itemsInput) {
      const prod = productMap.get(item.productId)
      if (!prod) {
        return NextResponse.json(
          { error: "Uno o más productos no están disponibles" },
          { status: 400 }
        )
      }
      if (typeof item.quantity !== "number" || item.quantity <= 0) {
        return NextResponse.json(
          { error: `Cantidad inválida para ${prod.name}` },
          { status: 400 }
        )
      }
    }

    // Calculate real subtotal from database prices
    const subtotal = itemsInput.reduce((acc, item) => {
      const prod = productMap.get(item.productId)!
      return acc + Math.round(Number(prod.price)) * item.quantity
    }, 0)

    const shipping = subtotal >= 50000 ? 0 : 3990
    const total = subtotal + shipping

    // Non-admin cannot set arbitrary status or confirm orders without paying through gateway
    const initialStatus = isAdmin && body.status ? body.status.toUpperCase() : "PENDING"

    // Generate order number
    const orderCount = await prisma.order.count()
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, "0")}`

    // Ensure user has valid address
    let addressId = body.addressId
    if (!addressId) {
      const userAddr = await prisma.address.findFirst({
        where: { userId: session.user.id },
        orderBy: { isDefault: "desc" },
      })
      if (userAddr) {
        addressId = userAddr.id
      } else {
        const userRec = await prisma.user.findUnique({ where: { id: session.user.id } })
        const createdAddr = await prisma.address.create({
          data: {
            userId: session.user.id,
            label: "Envío",
            name: userRec?.name || "Cliente",
            phone: userRec?.phone || "+56 9 0000 0000",
            address: "Por coordinar",
            city: "Santiago",
            state: "RM",
            zipCode: "0000000",
            isDefault: true,
          },
        })
        addressId = createdAddr.id
      }
    }

    const order = await prisma.order.create({
      data: {
        orderNumber,
        status: initialStatus,
        subtotal,
        shipping,
        discount: 0,
        total,
        paymentMethod: body.paymentMethod || "TRANSFER",
        stripeSessionId: isAdmin ? body.transactionId : null,
        notes: body.notes,
        userId: session.user.id,
        addressId,
        items: {
          create: itemsInput.map((item) => {
            const prod = productMap.get(item.productId)!
            const unitPrice = Math.round(Number(prod.price))
            return {
              productId: item.productId,
              name: prod.name,
              price: unitPrice,
              quantity: item.quantity,
              total: unitPrice * item.quantity,
              customImage: item.customImage || null,
            }
          }),
        },
      },
      include: {
        items: true,
        address: true,
      },
    })

    // If order was created confirmed by admin, send confirmation email
    if (initialStatus === "CONFIRMED") {
      const userRecord = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true, name: true },
      })

      if (userRecord?.email) {
        await sendOrderConfirmationEmail({
          to: userRecord.email,
          customerName: userRecord.name,
          orderNumber: order.orderNumber,
          orderTotal: total,
          orderItems: order.items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            price: Number(i.price),
          })),
          shippingAddress: `${order.address.address}, ${order.address.city}`,
          paymentMethod: order.paymentMethod,
        })
      }
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
      { error: "Error al crear el pedido" },
      { status: 500 }
    )
  }
}
