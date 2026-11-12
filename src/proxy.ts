import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await auth()

  // ── Rutas que requieren rol ADMIN o WORKER ─────────────────
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const isApi = pathname.startsWith("/api/")

    if (!session?.user) {
      if (isApi) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 })
      }
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "WORKER") {
      if (isApi) {
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
      }
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

export default proxy

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/profile/:path*",
    "/checkout/:path*",
  ],
}
