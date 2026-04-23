import { NextRequest, NextResponse } from "next/server"
import { commitWebpayTransaction } from "@/lib/webpay"
import { prisma } from "@/lib/prisma"

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

  // Validate token format — Webpay tokens are alphanumeric hex strings
  if (!/^[a-zA-Z0-9]{64}$/.test(token)) {
    return NextResponse.redirect(getCancelUrl(request, "invalid_token"))
  }

  try {
    const result = await commitWebpayTransaction(token)

    const isApproved =
      result.status === "AUTHORIZED" && Number(result.response_code) === 0

    if (!isApproved) {
      return NextResponse.redirect(getCancelUrl(request, "rejected"))
    }

    // Look up the pending order by buy_order (stored in stripeSessionId field for Webpay)
    const existingOrder = await prisma.order.findFirst({
      where: { stripeSessionId: result.buy_order },
    })

    if (existingOrder) {
      // Order already created — just redirect to success
      const order = await prisma.order.update({
        where: { id: existingOrder.id },
        data: { status: "CONFIRMED" },
      })
      return NextResponse.redirect(
        getSuccessUrl(request, order.trackingCode, order.orderNumber)
      )
    }

    // No order exists yet — redirect to success with transaction id
    // The client will create the order from cart data
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
