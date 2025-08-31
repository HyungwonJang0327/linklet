import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const wishlist = await prisma.wishlist.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { items: true }
        }
      }
    })
    
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
    const { title, description } = await request.json()
    
    const wishlist = await prisma.wishlist.update({
      where: { id },
      data: {
        title,
        description
      },
      include: {
        items: true,
        _count: {
          select: { items: true }
        }
      }
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
    await prisma.wishlist.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'Wishlist deleted successfully' })
  } catch (error) {
    console.error('Error deleting wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to delete wishlist' }, 
      { status: 500 }
    )
  }
}