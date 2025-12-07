import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db/client'
import { cleanupOldLogs } from '@/lib/utils/error-logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is admin
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const statusCode = searchParams.get('statusCode')
    const method = searchParams.get('method')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build filter conditions
    const where: any = {}

    if (statusCode) {
      where.statusCode = parseInt(statusCode)
    }

    if (method) {
      where.method = method
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Fetch errors and total count in parallel
    const [errors, totalCount] = await Promise.all([
      prisma.errorLog.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.errorLog.count({ where })
    ])

    // Get statistics
    const stats = await prisma.errorLog.groupBy({
      by: ['statusCode'],
      _count: {
        statusCode: true
      },
      orderBy: {
        _count: {
          statusCode: 'desc'
        }
      }
    })

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      errors,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      stats: stats.map(stat => ({
        statusCode: stat.statusCode,
        count: stat._count.statusCode
      }))
    })
  } catch (error) {
    console.error('[Errors API] Error fetching error logs:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch error logs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is admin
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const daysToKeep = parseInt(searchParams.get('daysToKeep') || '30')

    console.log(`[Errors API] Cleaning up error logs older than ${daysToKeep} days`)

    const deletedCount = await cleanupOldLogs(daysToKeep)

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Successfully deleted ${deletedCount} old error logs`
    })
  } catch (error) {
    console.error('[Errors API] Error cleaning up error logs:', error)
    return NextResponse.json(
      {
        error: 'Failed to cleanup error logs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
