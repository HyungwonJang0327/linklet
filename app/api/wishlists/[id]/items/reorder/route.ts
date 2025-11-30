import { NextResponse } from 'next/server'
import { reorderWishlistItems } from '@/lib/db/wishlist'
import { prisma } from '@/lib/db'
import { revalidateSharedWishlist } from '@/lib/revalidation'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { itemIds } = await request.json()

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: 'itemIds must be a non-empty array' },
        { status: 400 }
      )
    }

    // Reorder items
    await reorderWishlistItems(id, itemIds)

    // 공유 위시리스트인 경우 ISR 재검증
    const wishlist = await prisma.wishlist.findUnique({
      where: { id },
      select: { shareUrl: true }
    })

    if (wishlist?.shareUrl) {
      await revalidateSharedWishlist(wishlist.shareUrl)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering wishlist items:', error)
    return NextResponse.json(
      { error: 'Failed to reorder wishlist items' },
      { status: 500 }
    )
  }
}
