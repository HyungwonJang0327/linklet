import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const db = global.prisma || new PrismaClient()
export const prisma = db // Export as both db and prisma for compatibility

if (process.env.NODE_ENV !== 'production') {
  global.prisma = db
}