'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PlusIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'
import QuickAddProduct from './components/quick-add-product'
import WishlistCard from './components/wishlist-card'
import CreateWishlistCard from './components/create-wishlist-card'
import { useParams, useRouter } from 'next/navigation'

export default function WishlistsManagePage() {
  const { t } = useI18n()
  const router = useRouter()
  const { locale = 'kr' } = useParams()

  const [wishlists, setWishlists] = useState([
    {
      id: 1,
      title: '생일 선물 위시리스트',
      description: '올해 받고 싶은 생일 선물들',
      itemCount: 5,
      isPublic: true,
      createdAt: '2024-01-15'
    },
    {
      id: 2,
      title: '쇼핑 리스트',
      description: '평소 사고 싶었던 물건들',
      itemCount: 12,
      isPublic: false,
      createdAt: '2024-02-10'
    }
  ])

  const handleAddProductFromUrl = async (productUrl: string, selectedWishlist: string) => {
    // TODO: API call to extract product info from URL and add to wishlist
    console.log('Adding product from URL:', productUrl, 'to wishlist:', selectedWishlist)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Update wishlist item count (mock behavior)
    setWishlists(prev => prev.map(wishlist =>
      wishlist.id.toString() === selectedWishlist
        ? { ...wishlist, itemCount: wishlist.itemCount + 1 }
        : wishlist
    ))
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
      <QuickAddProduct wishlists={wishlists} onAddProduct={handleAddProductFromUrl} />

      {/* Wishlists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {wishlists.map((wishlist) => (
          <WishlistCard key={wishlist.id} wishlist={wishlist} />
        ))}
        <CreateWishlistCard />
      </div>
    </div>
  )
}