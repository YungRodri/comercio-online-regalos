import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { sendOrderConfirmationEmail } from "@/lib/email"
import Stripe from "stripe"
import { z } from "zod"

const stripeCheckoutItemsSchema = z.array(
  z.object({
    id: z.string().min(1),
    qty: z.number().int().positive().max(50),
  })
).min(1).max(100)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json(
      { error: "No signature" },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error("Webhook signature verification failed:", error)
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    )
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session

      const existingOrder = await prisma.order.findFirst({
        where: { stripeSessionId: session.id },
        select: { id: true, orderNumber: true },
      })
      if (existingOrder) {
        console.log("Order already exists for Stripe session:", session.id)
        break
      }

      // Get user ID from metadata (set during checkout)
      const userId = session.metadata?.userId
      // Empty string is the sentinel for "no coupon" (Stripe metadata requires strings)
      const couponIdRaw = session.metadata?.couponId
      const couponId = couponIdRaw && couponIdRaw !== "" ? couponIdRaw : null
      const discountAmount = parseFloat(session.metadata?.discountAmount || "0")

      if (!userId) {
        console.error("No userId in session metadata")
        break
      }

      // Parse items from metadata
      const itemsData = session.metadata?.items
      let rawItems: unknown = []
      try {
        rawItems = itemsData ? JSON.parse(itemsData) : []
      } catch {
        console.error("Invalid JSON in checkout items metadata")
        break
      }
      const parsedItems = stripeCheckoutItemsSchema.safeParse(rawItems)

      if (!parsedItems.success) {
        console.error("Invalid checkout items metadata")
        break
      }
      const items = parsedItems.data

      try {
        const customerAddress = session.customer_details?.address

        const result = await prisma.$transaction(async (tx) => {
          const user = await tx.user.findUnique({
            where: { id: userId },
          })

          if (!user) {
            throw new Error("User not found")
          }

          const productIds = [...new Set(items.map((i) => i.id))]
          const products = await tx.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true, price: true, stock: true },
          })
          const productsById = new Map(products.map((product) => [product.id, product]))

          if (productsById.size !== productIds.length) {
            throw new Error("Invalid products in checkout metadata")
          }

          const normalizedItems = items.map((item) => {
            const product = productsById.get(item.id)
            if (!product) {
              throw new Error("Invalid products in checkout metadata")
            }
            return {
              id: item.id,
              qty: item.qty,
              name: product.name,
              unitPrice: Number(product.price),
              stock: product.stock,
            }
          })

          const itemWithoutStock = normalizedItems.find((item) => item.qty > item.stock)
          if (itemWithoutStock) {
            throw new Error(`Stock insuficiente para ${itemWithoutStock.name}`)
          }

          const address = await tx.address.create({
            data: {
              userId: user.id,
              label: "Envio",
              name: session.customer_details?.name || user.name,
              phone: session.customer_details?.phone || "",
              address: customerAddress?.line1 || "",
              city: customerAddress?.city || "",
              state: customerAddress?.state || "",
              zipCode: customerAddress?.postal_code || "",
              isDefault: false,
            },
          })

          const subtotal = (session.amount_subtotal || 0) / 100
          const shipping = (session.shipping_cost?.amount_total || 0) / 100
          const total = (session.amount_total || 0) / 100

          const order = await tx.order.create({
            data: {
              userId: user.id,
              addressId: address.id,
              couponId: couponId || null,
              orderNumber: `BT-${session.id.slice(-12).toUpperCase()}`,
              status: "PROCESSING",
              subtotal,
              shipping,
              discount: discountAmount,
              total,
              paymentMethod: "Stripe",
              stripeSessionId: session.id,
              items: {
                create: normalizedItems.map((item) => ({
                  productId: item.id,
                  name: item.name,
                  price: item.unitPrice,
                  quantity: item.qty,
                  total: item.unitPrice * item.qty,
                })),
              },
            },
          })

          for (const item of normalizedItems) {
            const updated = await tx.product.updateMany({
              where: { id: item.id, stock: { gte: item.qty } },
              data: { stock: { decrement: item.qty } },
            })
            if (updated.count === 0) {
              throw new Error(`Stock insuficiente para ${item.name}`)
            }
          }

          if (couponId) {
            await tx.coupon.updateMany({
              where: { id: couponId },
              data: { usedCount: { increment: 1 } },
            })
          }

          return { order, user, normalizedItems }
        })

        console.log("Order created:", result.order.orderNumber)

        // Send confirmation email (non-blocking — errors are caught inside)
        await sendOrderConfirmationEmail({
          to: result.user.email,
          customerName: result.user.name,
          orderNumber: result.order.orderNumber,
          orderTotal: Number(result.order.total),
          orderItems: result.normalizedItems.map((item) => {
            return {
              name: item.name,
              quantity: item.qty,
              price: item.unitPrice,
            }
          }),
          shippingAddress: customerAddress
            ? [customerAddress.line1, customerAddress.city, customerAddress.state]
                .filter(Boolean)
                .join(", ")
            : undefined,
          paymentMethod: "Stripe",
        })
      } catch (error) {
        console.error("Error processing order:", error)
      }

      break
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log("Payment failed:", paymentIntent.id)
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
