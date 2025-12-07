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

    // Fetch category statistics
    const categoryStats = await prisma.wishlist.groupBy({
      by: ['category'],
      _count: {
        category: true
      },
      orderBy: {
        _count: {
          category: 'desc'
        }
      }
    })

    // Fetch top items by click count
    const topItems = await prisma.wishlistItem.findMany({
      orderBy: {
        clickCount: 'desc'
      },
      take: 10,
      select: {
        id: true,
        title: true,
        clickCount: true,
        wishlist: {
          select: {
            id: true
          }
        }
      }
    })

    // Count how many wishlists each item appears in
    const topItemsWithCount = await Promise.all(
      topItems.map(async (item) => {
        // For simplicity, we're using clickCount as a proxy
        // In a real scenario, you might want to count distinct wishlists
        return {
          id: item.id,
          title: item.title,
          clickCount: item.clickCount,
          wishlistCount: 1 // Each item belongs to one wishlist
        }
      })
    )

    return NextResponse.json({
      categoryStats: categoryStats.map(stat => ({
        category: stat.category,
        count: stat._count.category
      })),
      topItems: topItemsWithCount
    })
  } catch (error) {
    console.error('[Analytics API] Error fetching analytics data:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
