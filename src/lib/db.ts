import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const dbUrl = process.env.DATABASE_URL || 'file:/tmp/uber.db'
process.env.DATABASE_URL = dbUrl

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error'],
  datasources: { db: { url: dbUrl } },
})
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
