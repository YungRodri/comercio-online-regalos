import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { sendOrderConfirmationEmail } from "@/lib/email"
import { z } from "zod"

const createOrderSchema = z.object({
  addressId: z.string().min(1),
  transactionId: z.string().trim().min(1).max(128).optional(),
  paymentMethod: z.enum(["CARD", "TRANSFER", "WALLET", "CASH_ON_DELIVERY", "WEBPAY"]).optional(),
  notes: z.string().trim().max(500).optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.coerce.number().int().positive().max(50),
      customImage: z.string().trim().max(500).optional(),
    })
  ).min(1).max(100),
})

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

    const parsed = createOrderSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos de pedido inválidos" }, { status: 400 })
    }
    const body = parsed.data

    const address = await prisma.address.findFirst({
      where: { id: body.addressId, userId: session.user.id },
      select: { id: true },
    })
    if (!address) {
      return NextResponse.json({ error: "Dirección inválida" }, { status: 400 })
    }

    const productIds = [...new Set(body.items.map((item) => item.productId))]
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, name: true, price: true, stock: true },
    })
    const productsById = new Map(products.map((product) => [product.id, product]))

    if (productsById.size !== productIds.length) {
      return NextResponse.json({ error: "El carrito contiene productos inválidos" }, { status: 400 })
    }

    const normalizedItems = body.items.map((item) => {
      const product = productsById.get(item.productId)
      if (!product) {
        throw new Error("Producto inválido")
      }
      return {
        productId: item.productId,
        name: product.name,
        quantity: item.quantity,
        unitPrice: Number(product.price),
        stock: product.stock,
        customImage: item.customImage || null,
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
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    )
    const shipping = subtotal >= 200 ? 0 : 15
    const total = subtotal + shipping

    const order = await prisma.$transaction(async (tx) => {
      for (const item of normalizedItems) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        })
        if (updated.count === 0) {
          throw new Error(`Stock insuficiente para ${item.name}`)
        }
      }

      return tx.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          status: "CONFIRMED",
          subtotal,
          shipping,
          discount: 0,
          total,
          paymentMethod: body.paymentMethod === "WEBPAY" ? "TRANSFER" : (body.paymentMethod || "CARD"),
          stripeSessionId: body.transactionId,
          notes: body.notes,
          userId: session.user.id,
          addressId: body.addressId,
          items: {
            create: normalizedItems.map((item) => ({
              name: item.name,
              price: item.unitPrice,
              quantity: item.quantity,
              total: item.unitPrice * item.quantity,
              productId: item.productId,
              customImage: item.customImage,
            })),
          },
        },
        include: {
          items: true,
          address: true,
        },
      })
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
        orderItems: normalizedItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.unitPrice,
        })),
        paymentMethod: body.paymentMethod || "CARD",
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
    if (error instanceof Error && error.message.startsWith("Stock insuficiente")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Error creating order" },
      { status: 500 }
    )
  }
}
