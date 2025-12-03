import { NextResponse } from 'next/server'
import { updateWishlist } from '@/lib/db/wishlist'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const customization = await request.json()

    // Validate customization data
    if (!customization || typeof customization !== 'object') {
      return NextResponse.json(
        { error: 'Invalid customization data' },
        { status: 400 }
      )
    }

    // Update wishlist with customization
    const wishlist = await updateWishlist(id, {
      customization
    })

    return NextResponse.json({
      success: true,
      customization: wishlist.customization
    })
  } catch (error) {
    console.error('Error updating customization:', error)
    return NextResponse.json(
      { error: 'Failed to update customization' },
      { status: 500 }
    )
  }
}
