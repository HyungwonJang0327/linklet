import { useSharedWishlist } from '@/hooks/use-wishlists'
import { WishlistCard } from '@/components/wishlist/wishlist-card'
import { WishlistItemCard } from '@/components/wishlist/wishlist-item-card'
import { LoadingSpinner } from '@/components/ui/loading'
import { notFound } from 'next/navigation'
import { use } from 'react'

interface SharedWishlistPageProps {
  params: Promise<{
    shareUrl: string
  }>
}

export default function SharedWishlistPage({ params }: SharedWishlistPageProps) {
  const { shareUrl } = use(params)
  const { data: wishlist, isLoading, error } = useSharedWishlist(shareUrl)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    if (error.message.includes('not found')) {
      notFound()
    }
    
    if (error.message.includes('private')) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2 text-white">비공개 위시리스트</h1>
            <p className="text-slate-300">
              이 위시리스트는 비공개로 설정되어 있습니다.
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-white">오류가 발생했습니다</h1>
          <p className="text-slate-300">{error.message}</p>
        </div>
      </div>
    )
  }

  if (!wishlist) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <WishlistCard wishlist={wishlist} isSharedView={true} />
          
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-6 text-white">위시리스트 아이템</h2>
          {wishlist.items && wishlist.items.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {wishlist.items.map((item) => (
                <WishlistItemCard 
                  key={item.id} 
                  item={item} 
                  isSharedView={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400">
                아직 추가된 아이템이 없습니다.
              </p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}