import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { revalidateSharedWishlist } from '@/lib/revalidation'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const items = await prisma.wishlistItem.findMany({
      where: { wishlistId: id },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching wishlist items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wishlist items' }, 
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { title, description, productUrl, imageUrl, price, priority } = await request.json()
    
    if (!title || !productUrl) {
      return NextResponse.json(
        { error: 'Title and product URL are required' }, 
        { status: 400 }
      )
    }

    const item = await prisma.wishlistItem.create({
      data: {
        title,
        description,
        productUrl,
        imageUrl,
        price,
        priority: priority || 0,
        wishlistId: id
      }
    })

    // 공유 위시리스트인 경우 ISR 재검증
    const wishlist = await prisma.wishlist.findUnique({
      where: { id },
      select: { shareUrl: true }
    })
    
    if (wishlist?.shareUrl) {
      await revalidateSharedWishlist(wishlist.shareUrl)
    }
    
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating wishlist item:', error)
    return NextResponse.json(
      { error: 'Failed to create wishlist item' }, 
      { status: 500 }
    )
  }
}