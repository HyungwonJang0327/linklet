import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const wishlists = await prisma.wishlist.findMany({
      include: {
        items: true,
        _count: {
          select: { items: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(wishlists)
  } catch (error) {
    console.error('Error fetching wishlists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wishlists' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { title, description, userId } = await request.json()
    
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' }, 
        { status: 400 }
      )
    }

    const wishlistData: any = {
      title,
      description,
      userId: userId || null
    }

    // 회원일 때만 shareUrl 생성
    if (userId) {
      const { createId } = await import('@paralleldrive/cuid2')
      wishlistData.shareUrl = createId()
    }

    const wishlist = await prisma.wishlist.create({
      data: wishlistData,
      include: {
        items: true,
        _count: {
          select: { items: true }
        }
      }
    })
    
    return NextResponse.json(wishlist, { status: 201 })
  } catch (error) {
    console.error('Error creating wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to create wishlist' }, 
      { status: 500 }
    )
  }
}