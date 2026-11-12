import { NextRequest, NextResponse } from "next/server"
import { commitWebpayTransaction } from "@/lib/webpay"
import { prisma } from "@/lib/prisma"
import { sendOrderConfirmationEmail } from "@/lib/email"

function getAppUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
}

function getCancelUrl(request: NextRequest, reason: string) {
  const url = new URL("/checkout/cancel", getAppUrl(request))
  url.searchParams.set("provider", "webpay")
  url.searchParams.set("reason", reason)
  return url
}

function getSuccessUrl(request: NextRequest, trackingCode: string, orderNumber: string) {
  const url = new URL("/checkout/success", getAppUrl(request))
  url.searchParams.set("provider", "webpay")
  url.searchParams.set("tracking_code", trackingCode)
  url.searchParams.set("order_number", orderNumber)
  return url
}

async function extractToken(request: NextRequest) {
  const queryToken = request.nextUrl.searchParams.get("token_ws")
  if (queryToken) return { token: queryToken, cancelled: false }

  // TBK_TOKEN is set when user cancels on Webpay's page
  const queryTbkToken = request.nextUrl.searchParams.get("TBK_TOKEN")
  if (queryTbkToken) return { token: null, cancelled: true }

  try {
    const formData = await request.formData()
    const tbkToken = formData.get("TBK_TOKEN")
    if (tbkToken) return { token: null, cancelled: true }

    const token = formData.get("token_ws")
    return { token: typeof token === "string" ? token : null, cancelled: false }
  } catch (error) {
    console.error("Failed to parse Webpay form data:", error)
    return { token: null, cancelled: false }
  }
}

async function handleCommit(request: NextRequest) {
  const { token, cancelled } = await extractToken(request)

  if (cancelled) {
    return NextResponse.redirect(getCancelUrl(request, "user_cancelled"))
  }

  if (!token) {
    return NextResponse.redirect(getCancelUrl(request, "missing_token"))
  }

  // Validate token format — Webpay tokens are alphanumeric hex strings (64 chars)
  if (!/^[a-zA-Z0-9]{64}$/.test(token)) {
    return NextResponse.redirect(getCancelUrl(request, "invalid_token"))
  }

  try {
    const result = await commitWebpayTransaction(token)

    const isApproved =
      result.status === "AUTHORIZED" && Number(result.response_code) === 0

    // Look up the order by buy_order
    const existingOrder = await prisma.order.findFirst({
      where: { stripeSessionId: result.buy_order },
      include: {
        items: true,
        user: { select: { name: true, email: true } },
        address: true,
      },
    })

    if (!isApproved) {
      if (existingOrder && existingOrder.status === "PENDING") {
        await prisma.order.update({
          where: { id: existingOrder.id },
          data: { status: "CANCELLED" },
        })
      }
      return NextResponse.redirect(getCancelUrl(request, "rejected"))
    }

    if (existingOrder) {
      if (existingOrder.status === "PENDING") {
        // Transition order to CONFIRMED
        await prisma.order.update({
          where: { id: existingOrder.id },
          data: { status: "CONFIRMED" },
        })

        // Decrement product stock
        for (const item of existingOrder.items) {
          try {
            await prisma.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            })
          } catch (stockErr) {
            console.error(`Failed to decrement stock for item ${item.productId}:`, stockErr)
          }
        }

        // Send order confirmation email
        if (existingOrder.user?.email) {
          try {
            await sendOrderConfirmationEmail({
              to: existingOrder.user.email,
              customerName: existingOrder.user.name,
              orderNumber: existingOrder.orderNumber,
              orderTotal: Number(existingOrder.total),
              orderItems: existingOrder.items.map((i) => ({
                name: i.name,
                quantity: i.quantity,
                price: Number(i.price),
              })),
              shippingAddress: existingOrder.address
                ? `${existingOrder.address.address}, ${existingOrder.address.city}`
                : undefined,
              paymentMethod: "Webpay",
            })
          } catch (emailErr) {
            console.error("Error sending Webpay order confirmation email:", emailErr)
          }
        }
      }

      return NextResponse.redirect(
        getSuccessUrl(request, existingOrder.trackingCode, existingOrder.orderNumber)
      )
    }

    // Fallback if order was not found
    const url = new URL("/checkout/success", getAppUrl(request))
    url.searchParams.set("provider", "webpay")
    url.searchParams.set("transaction_id", result.buy_order)
    url.searchParams.set("amount", String(result.amount))
    return NextResponse.redirect(url)
  } catch (error) {
    console.error("Error committing Webpay transaction:", error)
    return NextResponse.redirect(getCancelUrl(request, "commit_error"))
  }
}

export async function GET(request: NextRequest) {
  return handleCommit(request)
}

export async function POST(request: NextRequest) {
  return handleCommit(request)
}
