import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { revalidateSharedWishlist } from '@/lib/revalidation'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { title, description, productUrl, imageUrl, price, priority } = await request.json()
    
    const item = await prisma.wishlistItem.update({
      where: { id },
      data: {
        title,
        description,
        productUrl,
        imageUrl,
        price,
        priority
      },
      include: {
        wishlist: {
          select: { shareUrl: true }
        }
      }
    })

    // 공유 위시리스트인 경우 ISR 재검증
    if (item.wishlist?.shareUrl) {
      await revalidateSharedWishlist(item.wishlist.shareUrl)
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
    const item = await prisma.wishlistItem.findUnique({
      where: { id },
      include: {
        wishlist: {
          select: { shareUrl: true }
        }
      }
    })

    await prisma.wishlistItem.delete({
      where: { id }
    })

    // 공유 위시리스트인 경우 ISR 재검증
    if (item?.wishlist?.shareUrl) {
      await revalidateSharedWishlist(item.wishlist.shareUrl)
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