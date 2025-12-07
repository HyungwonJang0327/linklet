import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

export async function GET() {
  const startTime = Date.now()

  try {
    // Check database connection with a simple query
    await prisma.$queryRaw`SELECT 1`

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: 'operational',
          message: 'API is running'
        },
        database: {
          status: 'operational',
          message: 'Database connection successful',
          responseTime: `${responseTime}ms`
        }
      },
      responseTime: `${responseTime}ms`
    })
  } catch (error) {
    const responseTime = Date.now() - startTime

    console.error('[Health Check] Error:', error)

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: 'operational',
          message: 'API is running'
        },
        database: {
          status: 'error',
          message: error instanceof Error ? error.message : 'Database connection failed',
          responseTime: `${responseTime}ms`
        }
      },
      responseTime: `${responseTime}ms`,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })
  }
}
