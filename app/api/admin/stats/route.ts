import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db/client'

export async function GET() {
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

    // Get 24 hours ago for error stats
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    // Fetch all stats in parallel
    const [totalUsers, totalWishlists, pendingErrors, pendingFeedback] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Total wishlists
      prisma.wishlist.count(),

      // Recent 5xx errors (last 24 hours)
      prisma.errorLog.count({
        where: {
          statusCode: {
            gte: 500
          },
          createdAt: {
            gte: twentyFourHoursAgo
          }
        }
      }),

      // Pending QnA feedback
      prisma.qnA.count({
        where: {
          status: 'pending'
        }
      })
    ])

    return NextResponse.json({
      totalUsers,
      totalWishlists,
      pendingErrors,
      pendingFeedback
    })
  } catch (error) {
    console.error('[Admin Stats API] Error fetching stats:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch admin stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
