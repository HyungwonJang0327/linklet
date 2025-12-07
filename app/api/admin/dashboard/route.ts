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

    // Get dates for comparison (60 days ago for calculating trends)
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    // Get 24 hours ago for error stats
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    // Get 48 hours ago for error comparison
    const fortyEightHoursAgo = new Date()
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48)

    // Fetch all statistics in parallel
    const [
      totalUsers,
      totalWishlists,
      activeUsers,
      recentActivities,
      categoryStats,
      popularWishlists,
      pendingQnAs,
      recentErrors,
      previousPeriodUsers,
      previousPeriodWishlists,
      previousPeriodActiveUsers,
      errorsLast24Hours,
      errorsPrevious24Hours
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
      }),

      // Recent error logs (5xx errors only)
      prisma.errorLog.findMany({
        where: {
          statusCode: {
            gte: 500
          }
        },
        take: 5,
        orderBy: {
          createdAt: 'desc'
        }
      }),

      // Previous period users (30-60 days ago) for trend calculation
      prisma.user.count({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      }),

      // Previous period wishlists (30-60 days ago) for trend calculation
      prisma.wishlist.count({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      }),

      // Previous period active users (30-60 days ago)
      prisma.user.count({
        where: {
          OR: [
            {
              wishlists: {
                some: {
                  createdAt: {
                    gte: sixtyDaysAgo,
                    lt: thirtyDaysAgo
                  }
                }
              }
            },
            {
              wishlists: {
                some: {
                  updatedAt: {
                    gte: sixtyDaysAgo,
                    lt: thirtyDaysAgo
                  }
                }
              }
            }
          ]
        }
      }),

      // Errors in last 24 hours
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

      // Errors in previous 24 hours (24-48 hours ago)
      prisma.errorLog.count({
        where: {
          statusCode: {
            gte: 500
          },
          createdAt: {
            gte: fortyEightHoursAgo,
            lt: twentyFourHoursAgo
          }
        }
      })
    ])

    console.log('[Dashboard API] Stats fetched:', { totalUsers, totalWishlists, activeUsers })

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number): string => {
      if (previous === 0) return current > 0 ? '+100%' : '0%'
      const change = ((current - previous) / previous) * 100
      const sign = change >= 0 ? '+' : ''
      return `${sign}${change.toFixed(1)}%`
    }

    const userChange = calculateChange(totalUsers, totalUsers - previousPeriodUsers)
    const wishlistChange = calculateChange(totalWishlists, totalWishlists - previousPeriodWishlists)
    const activeUserChange = calculateChange(activeUsers, previousPeriodActiveUsers)
    const errorChange = calculateChange(errorsLast24Hours, errorsPrevious24Hours)

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

    // Format recent errors
    const formattedErrors = recentErrors.map(error => ({
      id: error.id,
      endpoint: error.endpoint,
      method: error.method,
      statusCode: error.statusCode,
      message: error.message,
      timestamp: error.createdAt
    }))

    console.log('[Dashboard API] Dashboard data fetched successfully')

    return NextResponse.json({
      stats: {
        totalUsers,
        totalWishlists,
        activeUsers,
        errorsLast24Hours,
        userChange,
        wishlistChange,
        activeUserChange,
        errorChange
      },
      recentActivities: formattedActivities,
      categoryStats: formattedCategoryStats,
      popularWishlists: formattedPopularWishlists,
      qnaList: formattedQnAList,
      recentErrors: formattedErrors
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
