import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareUrl: string }> }
) {
  try {
    const { shareUrl } = await params
    const wishlist = await prisma.wishlist.findUnique({
      where: { shareUrl },
      include: {
        items: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { items: true }
        }
      }
    })
    
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