import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db/client'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is admin
    if (!session?.user) {
      console.log('[Dashboard API] No session found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!session.user.isAdmin) {
      console.log('[Dashboard API] User is not admin:', session.user.email)
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    console.log('[Dashboard API] Fetching dashboard data for admin:', session.user.email)

    // Get current date for 30-day active users calculation
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Fetch all statistics in parallel
    const [
      totalUsers,
      totalWishlists,
      activeUsers,
      recentActivities,
      categoryStats,
      popularWishlists,
      pendingQnAs
    ] = await Promise.all([
      // Total users count
      prisma.user.count(),

      // Total wishlists count
      prisma.wishlist.count(),

      // Active users in last 30 days (users who created or updated wishlists)
      prisma.user.count({
        where: {
          OR: [
            {
              wishlists: {
                some: {
                  createdAt: {
                    gte: thirtyDaysAgo
                  }
                }
              }
            },
            {
              wishlists: {
                some: {
                  updatedAt: {
                    gte: thirtyDaysAgo
                  }
                }
              }
            }
          ]
        }
      }),

      // Recent activities (last 10)
      prisma.wishlist.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              email: true,
              name: true
            }
          }
        }
      }),

      // Category statistics
      prisma.wishlist.groupBy({
        by: ['category'],
        _count: {
          category: true
        },
        orderBy: {
          _count: {
            category: 'desc'
          }
        }
      }),

      // Popular wishlists (by item count)
      prisma.wishlist.findMany({
        take: 5,
        orderBy: {
          items: {
            _count: 'desc'
          }
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              items: true
            }
          }
        }
      }),

      // Pending QnA questions
      prisma.qnA.findMany({
        where: {
          status: 'pending'
        },
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              email: true,
              name: true
            }
          }
        }
      })
    ])

    console.log('[Dashboard API] Stats fetched:', { totalUsers, totalWishlists, activeUsers })

    // Format recent activities
    const formattedActivities = recentActivities.map(wishlist => ({
      user: wishlist.user?.email || wishlist.user?.name || 'Unknown User',
      action: '새 위시리스트 생성',
      time: formatRelativeTime(wishlist.createdAt),
      timestamp: wishlist.createdAt
    }))

    // Format category stats
    const formattedCategoryStats = categoryStats.map(stat => ({
      category: stat.category,
      count: stat._count.category
    }))

    // Format popular wishlists
    const formattedPopularWishlists = popularWishlists.map(wishlist => ({
      id: wishlist.id,
      title: wishlist.title,
      category: wishlist.category,
      userName: wishlist.user?.name || wishlist.user?.email || 'Unknown',
      itemCount: wishlist._count.items,
      createdAt: wishlist.createdAt
    }))

    // Format QnA list
    const formattedQnAList = pendingQnAs.map(qna => ({
      id: qna.id,
      question: qna.question,
      user: qna.user?.email || qna.user?.name || 'Unknown User',
      status: qna.status,
      createdAt: qna.createdAt
    }))

    // Mock data for errors (to be implemented later)
    const mockErrors = [
      { id: '1', endpoint: '/api/wishlists', method: 'POST', statusCode: 500, message: 'Database connection failed', timestamp: new Date() },
      { id: '2', endpoint: '/api/items/123', method: 'PUT', statusCode: 503, message: 'Service unavailable', timestamp: new Date() },
      { id: '3', endpoint: '/api/users', method: 'GET', statusCode: 500, message: 'Internal server error', timestamp: new Date() }
    ]

    console.log('[Dashboard API] Dashboard data fetched successfully')

    return NextResponse.json({
      stats: {
        totalUsers,
        totalWishlists,
        activeUsers
      },
      recentActivities: formattedActivities,
      categoryStats: formattedCategoryStats,
      popularWishlists: formattedPopularWishlists,
      qnaList: formattedQnAList,
      recentErrors: mockErrors
    })
  } catch (error) {
    console.error('[Dashboard API] Error fetching dashboard data:', error)
    console.error('[Dashboard API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '방금 전'
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  return `${diffDays}일 전`
}
