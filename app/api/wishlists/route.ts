import { NextResponse } from 'next/server'
import { createWishlist } from '@/lib/db/wishlist'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'
import { APP_CONFIG } from '@/lib/constants'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (userId) {
      // Require authentication for user-specific wishlists
      const auth = await requireAuth()
      if (auth.error) return auth.error

      // Users can only view their own wishlists
      if (userId !== auth.session!.user.id) {
        return NextResponse.json(
          { error: 'You can only view your own wishlists' },
          { status: 403 }
        )
      }

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
  // Require authentication
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const { title, description, isPublic, category, productLinks } = await request.json()

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Check wishlist limit for free users
    const userId = auth.session!.user.id
    const existingWishlistCount = await prisma.wishlist.count({
      where: { userId }
    })

    // For now, all users are considered free tier
    const maxWishlists = APP_CONFIG.maxWishlistsPerUser.free

    if (existingWishlistCount >= maxWishlists) {
      return NextResponse.json(
        {
          error: 'WISHLIST_LIMIT_REACHED',
          message: `You can only create up to ${maxWishlists} wishlists`,
          limit: maxWishlists,
          current: existingWishlistCount
        },
        { status: 403 }
      )
    }

    // Use authenticated user's ID (ignore userId from request body for security)
    const wishlist = await createWishlist({
      title,
      description,
      isPublic: isPublic ?? false,
      category,
      userId: auth.session!.user.id,
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