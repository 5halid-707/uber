import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Force DATABASE_URL to be set - this MUST happen before PrismaClient creation
const DB_URL = 'file:/tmp/uber.db'
process.env.DATABASE_URL = process.env.DATABASE_URL || DB_URL

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
