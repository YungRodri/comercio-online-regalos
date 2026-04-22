import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

/**
 * Returns the current session if the user is authenticated,
 * otherwise returns a 401 NextResponse.
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    }
  }
  return { session, error: null }
}

/**
 * Returns the current session if the user has the ADMIN role,
 * otherwise returns a 401 or 403 NextResponse.
 */
export async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    }
  }
  if (session.user.role !== "ADMIN") {
    return {
      session: null,
      error: NextResponse.json({ error: "Acceso denegado" }, { status: 403 }),
    }
  }
  return { session, error: null }
}

/**
 * Returns the current session if the user has ADMIN or WORKER role.
 * Workers can manage orders and view customer contacts but cannot access
 * critical admin features (products, coupons, settings, user management).
 */
export async function requireWorkerOrAdmin() {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    }
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "WORKER") {
    return {
      session: null,
      error: NextResponse.json({ error: "Acceso denegado" }, { status: 403 }),
    }
  }
  return { session, error: null }
}
