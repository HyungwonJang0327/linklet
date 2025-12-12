import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db/client'
import { authOptions } from '@/lib/auth-config'

/**
 * Server-side authentication helper
 * Returns session or throws 401 error
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return {
      error: NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      ),
      session: null
    }
  }

  return {
    error: null,
    session: {
      user: {
        id: (session.user as any).id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image
      }
    }
  }
}

/**
 * Verify wishlist ownership
 * Returns wishlist if user owns it, otherwise returns error
 */
export async function verifyWishlistOwnership(wishlistId: string, userId: string) {
  const wishlist = await prisma.wishlist.findUnique({
    where: { id: wishlistId },
    select: { id: true, userId: true, title: true }
  })

  if (!wishlist) {
    return {
      error: NextResponse.json(
        { error: 'Wishlist not found' },
        { status: 404 }
      ),
      wishlist: null
    }
  }

  if (wishlist.userId !== userId) {
    return {
      error: NextResponse.json(
        { error: 'You do not have permission to access this wishlist' },
        { status: 403 }
      ),
      wishlist: null
    }
  }

  return {
    error: null,
    wishlist
  }
}

/**
 * Verify item ownership (through its wishlist)
 * Returns item if user owns it, otherwise returns error
 */
export async function verifyItemOwnership(itemId: string, userId: string) {
  const item = await prisma.wishlistItem.findUnique({
    where: { id: itemId },
    include: {
      wishlist: {
        select: { id: true, userId: true }
      }
    }
  })

  if (!item) {
    return {
      error: NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      ),
      item: null
    }
  }

  if (item.wishlist.userId !== userId) {
    return {
      error: NextResponse.json(
        { error: 'You do not have permission to access this item' },
        { status: 403 }
      ),
      item: null
    }
  }

  return {
    error: null,
    item
  }
}

/**
 * Require admin authentication
 * Returns user if authenticated and is admin, otherwise returns error
 */
export async function requireAdmin() {
  const auth = await requireAuth()

  if (auth.error) {
    return auth
  }

  // Fetch full user data to check admin status
  const user = await prisma.user.findUnique({
    where: { id: auth.session!.user.id },
    select: { id: true, email: true, name: true, isAdmin: true }
  })

  if (!user || !user.isAdmin) {
    return {
      error: NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      ),
      session: null,
      user: null
    }
  }

  return {
    error: null,
    session: auth.session,
    user
  }
}
