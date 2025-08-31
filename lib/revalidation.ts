const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET_TOKEN

interface RevalidateOptions {
  type: 'wishlist' | 'all-wishlists' | 'path'
  shareUrl?: string
  path?: string
}

export async function revalidateWishlist(options: RevalidateOptions) {
  if (!REVALIDATE_SECRET) {
    console.warn('REVALIDATE_SECRET_TOKEN not set, skipping revalidation')
    return
  }

  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'

    const response = await fetch(`${baseUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...options,
        secret: REVALIDATE_SECRET,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Revalidation failed:', error)
      return
    }

    const result = await response.json()
    console.log('Revalidation success:', result)
  } catch (error) {
    console.error('Revalidation error:', error)
  }
}

export async function revalidateSharedWishlist(shareUrl: string) {
  return revalidateWishlist({ type: 'wishlist', shareUrl })
}

export async function revalidateAllWishlists() {
  return revalidateWishlist({ type: 'all-wishlists' })
}

export async function revalidatePath(path: string) {
  return revalidateWishlist({ type: 'path', path })
}