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
    const search = searchParams.get('search') || ''
    const timeRange = searchParams.get('timeRange') || '24h'

    // Calculate time filter
    const now = new Date()
    let startTime = new Date()
    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
    }

    // Build filter conditions
    const where: any = {
      createdAt: {
        gte: startTime
      }
    }

    if (statusCode) {
      where.statusCode = parseInt(statusCode)
    }

    if (method) {
      where.method = method
    }

    if (search) {
      where.OR = [
        { endpoint: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
        { method: { contains: search, mode: 'insensitive' } }
      ]
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

    // Get user info for error logs with userId
    const userIds = errors
      .map(log => log.userId)
      .filter((id): id is string => id !== null)

    const users = userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true, name: true }
        })
      : []

    const userMap = new Map(users.map(u => [u.id, u]))

    // Enrich error logs with user data
    const enrichedErrors = errors.map(log => ({
      ...log,
      user: log.userId ? userMap.get(log.userId) : null
    }))

    // Get enhanced statistics
    const statsWhere = {
      createdAt: {
        gte: startTime
      }
    }

    const stats = await prisma.errorLog.groupBy({
      by: ['statusCode'],
      where: statsWhere,
      _count: {
        id: true
      }
    })

    const total5xxErrors = stats.reduce((sum, s) =>
      s.statusCode >= 500 ? sum + s._count.id : sum, 0
    )
    const status500Errors = stats.find(s => s.statusCode === 500)?._count.id || 0
    const status503Errors = stats.find(s => s.statusCode === 503)?._count.id || 0

    // Calculate endpoint distribution
    const endpointStats = await prisma.errorLog.groupBy({
      by: ['endpoint'],
      where: statsWhere,
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    })

    const errorsByEndpoint = endpointStats.map(stat => ({
      endpoint: stat.endpoint,
      count: stat._count.id,
      percentage: total5xxErrors > 0 ? Math.round((stat._count.id / total5xxErrors) * 100) : 0
    }))

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      errors: enrichedErrors,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      stats: {
        total5xxErrors,
        status500Errors,
        status503Errors
      },
      errorsByEndpoint
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
