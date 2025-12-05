import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkRateLimit, getClientIp, isLikelyBot, RATE_LIMITS } from '@/lib/rate-limit'

// 조회수/클릭수 증가
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { type, itemId } = await request.json() // 'view' 또는 'click', optional itemId

    if (!['view', 'click'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "view" or "click"' },
        { status: 400 }
      )
    }

    // Bot detection
    const userAgent = request.headers.get('user-agent')
    if (isLikelyBot(userAgent)) {
      // Silently ignore bot requests (return success but don't count)
      return NextResponse.json({
        success: true,
        counted: false,
        reason: 'bot_detected'
      })
    }

    // Get client IP
    const clientIp = getClientIp(request)

    // Rate limiting
    const rateLimitKey = `${type}:${clientIp}:${id}${itemId ? ':' + itemId : ''}`
    const rateLimit = type === 'view' ? RATE_LIMITS.VIEW : RATE_LIMITS.CLICK

    if (!checkRateLimit(rateLimitKey, rateLimit)) {
      // Rate limited - return success but don't count
      return NextResponse.json({
        success: true,
        counted: false,
        reason: 'rate_limited'
      })
    }

    // Update count in database
    if (type === 'view') {
      // View count: only update wishlist
      const wishlist = await prisma.wishlist.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
        select: {
          id: true,
          viewCount: true,
          clickCount: true
        }
      })

      return NextResponse.json({
        success: true,
        counted: true,
        data: wishlist
      })
    } else {
      // Click count: update both wishlist and item (if itemId provided)
      const updates: any[] = [
        prisma.wishlist.update({
          where: { id },
          data: { clickCount: { increment: 1 } },
          select: {
            id: true,
            viewCount: true,
            clickCount: true
          }
        })
      ]

      // If itemId is provided, also update the item's click count
      if (itemId) {
        updates.push(
          prisma.wishlistItem.update({
            where: { id: itemId },
            data: { clickCount: { increment: 1 } }
          })
        )
      }

      const [wishlist] = await prisma.$transaction(updates)

      return NextResponse.json({
        success: true,
        counted: true,
        data: wishlist
      })
    }
  } catch (error) {
    console.error('Error updating analytics:', error)
    return NextResponse.json(
      { error: 'Failed to update analytics' },
      { status: 500 }
    )
  }
}

// 분석 데이터 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const wishlist = await prisma.wishlist.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        viewCount: true,
        clickCount: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    if (!wishlist) {
      return NextResponse.json(
        { error: 'Wishlist not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(wishlist)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
