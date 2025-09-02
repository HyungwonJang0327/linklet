import { NextResponse } from 'next/server'
import { getWishlistByShareUrl } from '@/lib/db/wishlist'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareUrl: string }> }
) {
  try {
    const { shareUrl } = await params
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