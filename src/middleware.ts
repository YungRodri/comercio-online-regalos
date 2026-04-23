import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await auth()

  // ── Rutas que requieren rol ADMIN ──────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!session?.user) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "WORKER") {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  // ── Rutas que requieren autenticación ─────────────────────
  const protectedPaths = ["/profile", "/checkout"]
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (isProtected && !session?.user) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/profile/:path*",
    "/checkout/:path*",
  ],
}
