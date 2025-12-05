import { NextResponse } from 'next/server'
import { createWishlist } from '@/lib/db/wishlist'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (userId) {
      // Get user's wishlists with viewCount and clickCount
      const wishlists = await prisma.wishlist.findMany({
        where: { userId },
        include: {
          items: {
            select: {
              id: true,
              title: true,
              description: true,
              imageUrl: true,
              price: true,
              productUrl: true
            },
            orderBy: {
              priority: 'desc'
            },
            take: 10
          },
          _count: {
            select: {
              items: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      })
      return NextResponse.json(wishlists)
    }

    // Get public wishlists for browsing
    const wishlists = await prisma.wishlist.findMany({
      where: { isPublic: true },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: { items: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20 // Limit for performance
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
    const { title, description, isPublic, category, userId, productLinks } = await request.json()
    
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' }, 
        { status: 400 }
      )
    }

    const wishlist = await createWishlist({
      title,
      description,
      isPublic: isPublic ?? false,
      category,
      userId: userId || undefined,
      productLinks: productLinks || []
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