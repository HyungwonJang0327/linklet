'use client'

import { Button } from '@/components/ui/button'
import { PlusIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'
import { useAuth } from '@/components/providers/auth-provider'
import { useWishlists } from '@/hooks/use-wishlists'
import { Loading } from '@/components/ui/loading'
import QuickAddProduct from './components/quick-add-product'
import WishlistCard from './components/wishlist-card'
import CreateWishlistCard from './components/create-wishlist-card'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function WishlistsManagePage() {
  const { t } = useI18n()
  const router = useRouter()
  const { locale = 'kr' } = useParams()
  const { user, isAuthenticated } = useAuth()

  // Fetch user's wishlists using TanStack Query
  const { data: wishlists, isLoading, error } = useWishlists(user?.id)

  const handleAddProductFromUrl = async (productUrl: string, selectedWishlistId: string) => {
    try {
      // Extract metadata from URL
      const metadataResponse = await fetch('/api/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: productUrl }),
      })

      if (!metadataResponse.ok) {
        throw new Error(t('item.errors.metadataFailed') || '상품 정보를 가져올 수 없습니다')
      }

      const metadata = await metadataResponse.json()

      // Create wishlist item with extracted metadata
      const createResponse = await fetch(`/api/wishlists/${selectedWishlistId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: metadata.title || 'Untitled Product',
          productUrl: productUrl,
          imageUrl: metadata.images?.[0] || null,
          description: metadata.description || null,
          price: metadata.price || null,
        }),
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json()
        throw new Error(errorData.error || t('item.errors.addFailed') || '상품 추가에 실패했습니다')
      }

      toast.success(t('item.addSuccess') || '상품이 추가되었습니다')

      // Refresh wishlists to show updated item count
      if (wishlists) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to add product:', error)
      toast.error(error instanceof Error ? error.message : t('item.errors.addFailed') || '상품 추가에 실패했습니다')
      throw error
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">
          {t('auth.settingsAccess.title')}
        </h2>
        <p className="text-slate-300 mb-6">
          {t('auth.settingsAccess.description')}
        </p>
        <Button onClick={() => router.push(`/${locale}/login`)}>
          {t('navigation.login')}
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <Loading text={t('common.loading')} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-red-400 mb-4">
          {t('common.error')}
        </h2>
        <p className="text-slate-300">
          {error instanceof Error ? error.message : 'Failed to load wishlists'}
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('settings.wishlists.manage')}</h1>
          <p className="text-slate-300">
            {t('settings.wishlists.manageDesc')}
          </p>
        </div>

        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => router.push(`/${locale}/settings/wishlists/create`)}
        >
          <PlusIcon className="w-4 h-4 mr-2" />
{t('wishlist.createButton')}
        </Button>
      </div>

      {/* Quick Add Product from URL */}
      {wishlists && wishlists.length > 0 && (
        <QuickAddProduct wishlists={wishlists} onAddProduct={handleAddProductFromUrl} />
      )}

      {/* Wishlists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {wishlists && wishlists.length > 0 ? (
          <>
            {wishlists.map((wishlist) => (
              <WishlistCard key={wishlist.id} wishlist={wishlist} />
            ))}
            <CreateWishlistCard />
          </>
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-slate-400 mb-6">
              {t('wishlist.create.subtitle') || '아직 생성된 위시리스트가 없습니다'}
            </p>
            <CreateWishlistCard />
          </div>
        )}
      </div>
    </div>
  )
}