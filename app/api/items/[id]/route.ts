import { NextResponse } from 'next/server'
import { updateWishlistItem, deleteWishlistItem, getWishlistItem } from '@/lib/db/wishlist'
import { revalidateSharedWishlist } from '@/lib/revalidation'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { title, description, productUrl, imageUrl, price, priority, isCompleted } = await request.json()
    
    const item = await updateWishlistItem(id, {
      title,
      description,
      productUrl,
      imageUrl,
      price,
      priority,
      isCompleted
    })

    // Get wishlist info for revalidation
    const itemWithWishlist = await getWishlistItem(id)
    
    // 공유 위시리스트인 경우 ISR 재검증
    if (itemWithWishlist?.wishlist) {
      const wishlist = itemWithWishlist.wishlist as any
      if (wishlist.shareUrl) {
        await revalidateSharedWishlist(wishlist.shareUrl)
      }
    }
    
    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating wishlist item:', error)
    return NextResponse.json(
      { error: 'Failed to update wishlist item' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // 삭제 전에 위시리스트 정보 가져오기
    const item = await getWishlistItem(id)

    await deleteWishlistItem(id)

    // 공유 위시리스트인 경우 ISR 재검증
    if (item?.wishlist) {
      const wishlist = item.wishlist as any
      if (wishlist.shareUrl) {
        await revalidateSharedWishlist(wishlist.shareUrl)
      }
    }
    
    return NextResponse.json({ message: 'Wishlist item deleted successfully' })
  } catch (error) {
    console.error('Error deleting wishlist item:', error)
    return NextResponse.json(
      { error: 'Failed to delete wishlist item' }, 
      { status: 500 }
    )
  }
}