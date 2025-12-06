import { NextResponse } from 'next/server'
import { getWishlistByShareUrl } from '@/lib/db/wishlist'
import { checkRateLimit, getClientIp, isLikelyBot, RATE_LIMITS } from '@/lib/rate-limit'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareUrl: string }> }
) {
  try {
    const { shareUrl } = await params

    // Bot detection
    const userAgent = request.headers.get('user-agent')
    if (isLikelyBot(userAgent)) {
      return NextResponse.json(
        { error: 'Automated requests are not allowed' },
        { status: 403 }
      )
    }

    // Get client IP for rate limiting
    const clientIp = getClientIp(request)

    // Rate limiting: prevent abuse from same IP
    const rateLimitKey = `shared-wishlist:${clientIp}:${shareUrl}`
    if (!checkRateLimit(rateLimitKey, RATE_LIMITS.SHARED_WISHLIST)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const wishlist = await getWishlistByShareUrl(shareUrl)
    
    if (!wishlist) {
      return NextResponse.json(
        { error: 'Wishlist not found' }, 
        { status: 404 }
      )
    }

    if (!wishlist.isPublic) {
      return NextResponse.json(
        { error: 'This wishlist is private' }, 
        { status: 403 }
      )
    }
    
    return NextResponse.json(wishlist)
  } catch (error) {
    console.error('Error fetching shared wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wishlist' }, 
      { status: 500 }
    )
  }
}