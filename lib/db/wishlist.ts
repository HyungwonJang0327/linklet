import { db } from './client'
import { WishlistCategory } from '@prisma/client'
import { createId } from '@paralleldrive/cuid2'
import type { ProductMetadata } from '@/lib/services/url-metadata'

export interface CreateWishlistData {
  title: string
  description?: string
  isPublic?: boolean
  category?: WishlistCategory
  userId?: string
  productLinks?: Array<{
    url: string
    metadata?: ProductMetadata | null
  }>
}

export interface CreateWishlistItemData {
  title: string
  description?: string
  productUrl: string
  imageUrl?: string
  price?: string
  siteName?: string
  priority?: number
}

export interface UpdateWishlistData {
  title?: string
  description?: string
  isPublic?: boolean
  category?: WishlistCategory
  customization?: any
}

export interface UpdateWishlistItemData {
  title?: string
  description?: string
  productUrl?: string
  imageUrl?: string
  price?: string
  siteName?: string
  priority?: number
  isCompleted?: boolean
}

// Wishlist Operations
export async function createWishlist(data: CreateWishlistData) {
  if (!data?.title?.trim()) {
    throw new Error('Wishlist title is required')
  }

  const { productLinks, ...wishlistData } = data

  // Sanitize data
  const sanitizedData = {
    ...wishlistData,
    title: data.title.trim(),
    description: data.description?.trim() || null,
    userId: data.userId?.trim() || null,
  }

  // Generate unique share URL
  const shareUrl = `w/${createId()}`

  try {
    const wishlist = await db.wishlist.create({
      data: {
        ...sanitizedData,
        shareUrl,
        category: data.category || WishlistCategory.GENERAL
      },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Add product links as items if provided
    if ([...(productLinks || [])].length > 0) {
      const validLinks = [...(productLinks || [])].filter(link => link?.url?.trim())

      if (validLinks.length > 0) {
        const items = await Promise.all(
          validLinks.map(async (link, index) => {
            const metadata = link.metadata
            return db.wishlistItem.create({
              data: {
                title: metadata?.title?.trim() || `Product ${index + 1}`,
                description: metadata?.description?.trim() || null,
                productUrl: link.url.trim(),
                imageUrl: metadata?.imageUrl?.trim() || null,
                price: metadata?.price?.trim() || null,
                siteName: metadata?.siteName?.trim() || null,
                wishlistId: wishlist.id,
                priority: index
              }
            })
          })
        )

        return {
          ...wishlist,
          items
        }
      }
    }

    return wishlist
  } catch (error) {
    console.error('Error creating wishlist:', error)
    throw error instanceof Error ? error : new Error('Failed to create wishlist')
  }
}

export async function getWishlistById(id: string, includeItems = true) {
  return db.wishlist.findUnique({
    where: { id },
    include: {
      items: includeItems ? {
        orderBy: [
          { priority: 'asc' },
          { createdAt: 'asc' }
        ]
      } : false,
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })
}

export async function getWishlistByShareUrl(shareUrl: string, includeItems = true) {
  return db.wishlist.findUnique({
    where: { shareUrl },
    include: {
      items: includeItems ? {
        orderBy: [
          { priority: 'asc' },
          { createdAt: 'asc' }
        ]
      } : false,
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })
}

export async function getUserWishlists(userId: string) {
  return db.wishlist.findMany({
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
}

export async function updateWishlist(id: string, data: UpdateWishlistData) {
  return db.wishlist.update({
    where: { id },
    data,
    include: {
      items: {
        orderBy: [
          { priority: 'asc' },
          { createdAt: 'asc' }
        ]
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })
}

export async function deleteWishlist(id: string) {
  return db.wishlist.delete({
    where: { id }
  })
}

// Wishlist Item Operations
export async function addWishlistItem(wishlistId: string, data: CreateWishlistItemData) {
  return db.wishlistItem.create({
    data: {
      ...data,
      wishlistId
    },
    include: {
      wishlist: {
        select: {
          id: true,
          title: true,
          userId: true
        }
      }
    }
  })
}

export async function getWishlistItem(id: string) {
  return db.wishlistItem.findUnique({
    where: { id },
    include: {
      wishlist: {
        select: {
          id: true,
          title: true,
          userId: true
        }
      }
    }
  })
}

export async function updateWishlistItem(id: string, data: UpdateWishlistItemData) {
  return db.wishlistItem.update({
    where: { id },
    data
  })
}

export async function deleteWishlistItem(id: string) {
  return db.wishlistItem.delete({
    where: { id }
  })
}

export async function reorderWishlistItems(wishlistId: string, itemIds: string[]) {
  const updates = itemIds.map((id, index) =>
    db.wishlistItem.update({
      where: { id },
      data: { priority: index }
    })
  )

  return db.$transaction(updates)
}

// Statistics
export async function getWishlistStats(userId: string) {
  const [totalWishlists, totalItems, publicWishlists] = await Promise.all([
    db.wishlist.count({
      where: { userId }
    }),
    db.wishlistItem.count({
      where: {
        wishlist: {
          userId
        }
      }
    }),
    db.wishlist.count({
      where: {
        userId,
        isPublic: true
      }
    })
  ])

  return {
    totalWishlists,
    totalItems,
    publicWishlists,
    privateWishlists: totalWishlists - publicWishlists
  }
}