import { useSharedWishlist } from '@/hooks/use-wishlists'
import { WishlistCard } from '@/components/wishlist/wishlist-card'
import { WishlistItemCard } from '@/components/wishlist/wishlist-item-card'
import { LoadingSpinner } from '@/components/ui/loading'
import { notFound } from 'next/navigation'
import { use } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { type Locale } from '@/lib/i18n/config'

interface SharedWishlistPageProps {
  params: Promise<{
    locale: Locale
    shareUrl: string
  }>
}

export default function SharedWishlistPage({ params }: SharedWishlistPageProps) {
  const { locale, shareUrl } = use(params)
  const { t } = useI18n()
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
            <h1 className="text-2xl font-bold mb-2 text-white">{t('wishlist.shared.private')}</h1>
            <p className="text-slate-300">
              {t('wishlist.shared.privateMessage')}
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-white">{t('wishlist.shared.error')}</h1>
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
            <h2 className="text-2xl font-bold mb-6 text-white">{t('wishlist.items')}</h2>
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
                {t('wishlist.noItems')}
              </p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}