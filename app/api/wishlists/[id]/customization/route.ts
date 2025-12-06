import { NextResponse } from 'next/server'
import { updateWishlist } from '@/lib/db/wishlist'
import { requireAuth, verifyWishlistOwnership } from '@/lib/auth-helpers'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Authentication and ownership check
    const auth = await requireAuth()
    if (auth.error) return auth.error

    const ownership = await verifyWishlistOwnership(id, auth.session!.user.id)
    if (ownership.error) return ownership.error

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
