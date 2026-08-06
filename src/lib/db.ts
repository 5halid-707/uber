import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const dbUrl = process.env.DATABASE_URL || 'file:/tmp/uber.db'
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = dbUrl
}

export const db = globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] })
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
