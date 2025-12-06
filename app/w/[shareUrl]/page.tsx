import SharedWishlistClient from './shared-wishlist-client'

// Enable ISR with 10 minute revalidation
export const revalidate = 600

interface SharedWishlistPageProps {
  params: Promise<{
    shareUrl: string
  }>
}

export default async function SharedWishlistPage({ params }: SharedWishlistPageProps) {
  const { shareUrl } = await params

  return (
    <div>
      <SharedWishlistClient shareUrl={shareUrl} />
    </div>
  )
}