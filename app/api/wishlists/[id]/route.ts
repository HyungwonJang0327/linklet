import { NextResponse } from 'next/server'
import { getWishlistById, updateWishlist, deleteWishlist } from '@/lib/db/wishlist'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const wishlist = await getWishlistById(id)
    
    if (!wishlist) {
      return NextResponse.json(
        { error: 'Wishlist not found' }, 
        { status: 404 }
      )
    }
    
    return NextResponse.json(wishlist)
  } catch (error) {
    console.error('Error fetching wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wishlist' }, 
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { title, description, isPublic, category } = await request.json()
    
    const wishlist = await updateWishlist(id, {
      title,
      description,
      isPublic,
      category
    })
    
    return NextResponse.json(wishlist)
  } catch (error) {
    console.error('Error updating wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to update wishlist' }, 
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
    await deleteWishlist(id)
    
    return NextResponse.json({ message: 'Wishlist deleted successfully' })
  } catch (error) {
    console.error('Error deleting wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to delete wishlist' }, 
      { status: 500 }
    )
  }
}