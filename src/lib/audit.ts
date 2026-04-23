import { prisma } from "@/lib/prisma"

export type AuditResource = "product" | "order" | "user" | "coupon"

interface AuditParams {
  userId: string
  userEmail: string
  action: "CREATE" | "UPDATE" | "DELETE"
  resource: AuditResource
  resourceId: string
  before?: unknown
  after?: unknown
}

/**
 * Write an audit log entry.
 * Errors are silently swallowed so an audit failure never breaks the main flow.
 */
export async function writeAuditLog(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        userEmail: params.userEmail,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        before: params.before ? (params.before as object) : undefined,
        after: params.after ? (params.after as object) : undefined,
      },
    })
  } catch (err) {
    console.error("[audit] Failed to write audit log:", err)
  }
}
