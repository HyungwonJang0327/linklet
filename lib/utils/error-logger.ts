import { prisma } from '@/lib/db/client'
import { NextRequest } from 'next/server'

interface ErrorLogData {
  endpoint: string
  method: string
  statusCode: number
  message: string
  stack?: string
  userId?: string
  request?: NextRequest
}

export async function logError(data: ErrorLogData) {
  // Only log 5xx errors (server errors)
  if (data.statusCode < 500) {
    return
  }

  try {
    // Extract IP and User Agent from request if available
    let ip: string | undefined
    let userAgent: string | undefined

    if (data.request) {
      // Get IP from headers
      ip = data.request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
           data.request.headers.get('x-real-ip') ||
           undefined

      // Get User Agent
      userAgent = data.request.headers.get('user-agent') || undefined
    }

    await prisma.errorLog.create({
      data: {
        endpoint: data.endpoint,
        method: data.method,
        statusCode: data.statusCode,
        message: data.message.substring(0, 5000), // Limit message length
        stack: data.stack ? data.stack.substring(0, 10000) : undefined, // Limit stack length
        userId: data.userId,
        ip,
        userAgent
      }
    })

    console.log(`[Error Logger] Logged error: ${data.method} ${data.endpoint} - ${data.statusCode}`)
  } catch (error) {
    // Don't throw error if logging fails - just log to console
    console.error('[Error Logger] Failed to log error to database:', error)
  }
}

export async function cleanupOldLogs(daysToKeep: number = 30) {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const result = await prisma.errorLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    })

    console.log(`[Error Logger] Cleaned up ${result.count} old error logs`)
    return result.count
  } catch (error) {
    console.error('[Error Logger] Failed to cleanup old logs:', error)
    return 0
  }
}
