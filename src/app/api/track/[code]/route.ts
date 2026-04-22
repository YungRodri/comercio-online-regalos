import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Params = Promise<{ code: string }>

const statusLabels: Record<string, string> = {
  PENDING: "Pedido recibido",
  CONFIRMED: "Pago confirmado",
  PROCESSING: "En fabricación",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
}

const statusOrder = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
]

export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { code } = await params

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return NextResponse.json(
        { error: "Código de seguimiento inválido" },
        { status: 400 }
      )
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { trackingCode: code.trim() },
          { orderNumber: code.trim() },
        ],
      },
      select: {
        orderNumber: true,
        trackingCode: true,
        status: true,
        fabricationNote: true,
        createdAt: true,
        updatedAt: true,
        total: true,
        items: {
          select: {
            name: true,
            quantity: true,
            customImage: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: "No se encontró ningún pedido con ese código" },
        { status: 404 }
      )
    }

    const currentStatusIndex = statusOrder.indexOf(order.status)

    const timeline = statusOrder.map((s, index) => ({
      status: s,
      label: statusLabels[s] || s,
      completed: index <= currentStatusIndex && order.status !== "CANCELLED",
      current: s === order.status,
    }))

    return NextResponse.json({
      orderNumber: order.orderNumber,
      trackingCode: order.trackingCode,
      status: order.status,
      statusLabel: statusLabels[order.status] || order.status,
      fabricationNote: order.fabricationNote,
      total: Number(order.total),
      itemCount: order.items.reduce((sum, i) => sum + i.quantity, 0),
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        hasCustomImage: !!item.customImage,
      })),
      timeline,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error("Error tracking order:", error)
    return NextResponse.json(
      { error: "Error al consultar el seguimiento" },
      { status: 500 }
    )
  }
}
