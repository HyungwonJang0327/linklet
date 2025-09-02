import { db } from './index'
import { WishlistCategory } from '@prisma/client'
import { createId } from '@paralleldrive/cuid2'

export interface CreateWishlistData {
  title: string
  description?: string
  isPublic?: boolean
  category?: WishlistCategory
  userId?: string
  productLinks?: string[]
}

export interface CreateWishlistItemData {
  title: string
  description?: string
  productUrl: string
  imageUrl?: string
  price?: string
  priority?: number
}

export interface UpdateWishlistData {
  title?: string
  description?: string
  isPublic?: boolean
  category?: WishlistCategory
}

export interface UpdateWishlistItemData {
  title?: string
  description?: string
  productUrl?: string
  imageUrl?: string
  price?: string
  priority?: number
  isCompleted?: boolean
}

// Wishlist Operations
export async function createWishlist(data: CreateWishlistData) {
  const { productLinks, ...wishlistData } = data
  
  // Generate unique share URL
  const shareUrl = `w/${createId()}`
  
  const wishlist = await db.wishlist.create({
    data: {
      ...wishlistData,
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
  if (productLinks && productLinks.length > 0) {
    const items = await Promise.all(
      productLinks
        .filter(url => url.trim())
        .map(async (productUrl, index) => {
          return db.wishlistItem.create({
            data: {
              title: `Product ${index + 1}`, // Default title, could be enhanced with URL parsing
              productUrl: productUrl.trim(),
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

  return wishlist
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
          id: true
        }
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