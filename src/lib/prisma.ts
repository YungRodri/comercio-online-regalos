import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

function getPool(): Pool {
  if (globalForPrisma.pool) {
    return globalForPrisma.pool
  }
  const isProduction = process.env.NODE_ENV === "production"
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Serverless functions in Vercel should cap connections to prevent exhausting Postgres connection limits
    max: isProduction ? 1 : 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })
  globalForPrisma.pool = pool
  return pool
}

function createPrismaClient() {
  const pool = getPool()
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

globalForPrisma.prisma = prisma
