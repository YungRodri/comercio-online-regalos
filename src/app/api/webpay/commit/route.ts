import { NextRequest, NextResponse } from "next/server"
import { commitWebpayTransaction } from "@/lib/webpay"

function getAppUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
}

function getCancelUrl(request: NextRequest, reason: string) {
  const url = new URL("/checkout/cancel", getAppUrl(request))
  url.searchParams.set("provider", "webpay")
  url.searchParams.set("reason", reason)
  return url
}

function getSuccessUrl(request: NextRequest, transactionId: string) {
  const url = new URL("/checkout/success", getAppUrl(request))
  url.searchParams.set("provider", "webpay")
  url.searchParams.set("transaction_id", transactionId)
  return url
}

async function extractToken(request: NextRequest) {
  const queryToken = request.nextUrl.searchParams.get("token_ws")
  if (queryToken) return queryToken

  const contentType = request.headers.get("content-type") || ""
  if (!contentType.includes("application/x-www-form-urlencoded")) return null

  const formData = await request.formData()
  const token = formData.get("token_ws")
  return typeof token === "string" ? token : null
}

async function handleCommit(request: NextRequest) {
  const token = await extractToken(request)

  if (!token) {
    return NextResponse.redirect(getCancelUrl(request, "missing_token"))
  }

  try {
    const result = await commitWebpayTransaction(token)

    const isApproved =
      result.status === "AUTHORIZED" && Number(result.response_code) === 0

    if (!isApproved) {
      return NextResponse.redirect(getCancelUrl(request, "rejected"))
    }

    return NextResponse.redirect(getSuccessUrl(request, result.buy_order))
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

