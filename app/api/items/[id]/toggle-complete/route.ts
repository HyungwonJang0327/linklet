import { NextResponse } from 'next/server'
import { getWishlistItem, updateWishlistItem } from '@/lib/db/wishlist'
import { revalidateSharedWishlist } from '@/lib/revalidation'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get current item to toggle its completion status
    const currentItem = await getWishlistItem(id)

    if (!currentItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    // Toggle completion status
    const item = await updateWishlistItem(id, {
      isCompleted: !currentItem.isCompleted
    })

    // Revalidate shared wishlist if applicable
    if (currentItem.wishlist) {
      const wishlist = currentItem.wishlist as any
      if (wishlist.shareUrl) {
        await revalidateSharedWishlist(wishlist.shareUrl)
      }
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error toggling item completion:', error)
    return NextResponse.json(
      { error: 'Failed to toggle completion status' },
      { status: 500 }
    )
  }
}
