'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ChevronDownIcon,
  PlusIcon,
  EyeIcon,
  ShareIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/components/providers/auth-provider'
import { useWishlists } from '@/hooks/use-wishlists'
import { Loading } from '@/components/ui/loading'
import { useRouter, useParams } from 'next/navigation'
import { useI18n } from '@/lib/i18n/context'

interface WishlistSelectorProps {
  selectedWishlistId: string | null
  onWishlistSelect: (wishlist: any) => void
}

export function WishlistSelector({ selectedWishlistId, onWishlistSelect }: WishlistSelectorProps) {
  const { user } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const { locale = 'kr' } = useParams()
  const [isOpen, setIsOpen] = useState(false)

  // Fetch user's wishlists using TanStack Query
  const { data: wishlists, isLoading, error } = useWishlists(user?.id)

  const selectedWishlist = wishlists?.find(w => w.id === selectedWishlistId)

  const handleSelect = (wishlist: any) => {
    onWishlistSelect(wishlist)
    setIsOpen(false)
  }

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm relative z-30">
        <div className="p-6">
          <Loading text={t('settings.customize.loading')} />
        </div>
      </Card>
    )
  }

  if (error || !wishlists || wishlists.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm relative z-30">
        <div className="p-6 text-center">
          <p className="text-slate-400 mb-4">
            {error ? t('settings.customize.loadError') : t('settings.customize.noWishlists')}
          </p>
          <Button
            onClick={() => router.push(`/${locale}/settings/wishlists/create`)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            {t('settings.customize.createFirst')}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm relative z-30">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">{t('settings.customize.selectWishlist')}</h2>
          <Button
            variant="outline"
            size="sm"
            className="text-slate-300 border-slate-600 hover:bg-slate-700/50"
            onClick={() => router.push(`/${locale}/settings/wishlists/create`)}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            {t('settings.customize.newWishlist')}
          </Button>
        </div>

        <p className="text-slate-400 text-sm mb-6">
          {t('settings.customize.selectWishlistDesc')}
        </p>

        {/* Selected Wishlist Display */}
        <div className="relative mb-4 z-40">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-lg text-left hover:bg-slate-700/70 transition-colors"
          >
            {selectedWishlist ? (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-white mb-1">{selectedWishlist.title}</div>
                  <div className="text-sm text-slate-400">{selectedWishlist.items?.length || 0}{t('settings.customize.itemsCount')}</div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedWishlist.customization && (
                    <div className="flex items-center gap-1 text-xs text-blue-400">
                      <Cog6ToothIcon className="w-3 h-3" />
                      {t('settings.customize.customized')}
                    </div>
                  )}
                  <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`} />
                </div>
              </div>
            ) : (
              <div className="text-slate-400">{t('settings.customize.selectWishlistPlaceholder')}</div>
            )}
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-lg shadow-xl z-50 max-h-80 overflow-auto">
              {wishlists.map((wishlist) => (
                <button
                  key={wishlist.id}
                  onClick={() => handleSelect(wishlist)}
                  className={`w-full p-4 text-left hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 last:border-b-0 ${
                    selectedWishlistId === wishlist.id ? 'bg-blue-600/10 border-blue-500/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className={`font-medium mb-1 ${
                        selectedWishlistId === wishlist.id ? 'text-blue-300' : 'text-white'
                      }`}>
                        {wishlist.title}
                      </div>
                      <div className="text-sm text-slate-400 mb-2">{wishlist.description}</div>

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{wishlist.items?.length || 0}{t('settings.customize.itemsCount')}</span>
                        <span>{new Date(wishlist.createdAt).toLocaleDateString('ko-KR')}</span>
                        {wishlist.isPublic && (
                          <div className="flex items-center gap-1 text-green-400">
                            <EyeIcon className="w-3 h-3" />
                            {t('settings.customize.public')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 ml-4">
                      {wishlist.customization && (
                        <div className="flex items-center gap-1 text-xs text-blue-400">
                          <Cog6ToothIcon className="w-3 h-3" />
                          {t('settings.customize.customized')}
                        </div>
                      )}
                      
                      {wishlist.isPublic && wishlist.shareUrl && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(`/w/${wishlist.shareUrl}`, '_blank')
                          }}
                          className="text-slate-400 hover:text-white p-1 h-auto hover:bg-slate-600/50 rounded transition-colors"
                        >
                          <ShareIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Wishlist Info */}
        {selectedWishlist && (
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-white">{t('settings.customize.selectedWishlist')}</h3>
              {selectedWishlist.isPublic && selectedWishlist.shareUrl && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">{t('settings.customize.shareLink')}</span>
                  <code className="text-xs bg-slate-900/50 px-2 py-1 rounded text-blue-300">
                    /w/{selectedWishlist.shareUrl}
                  </code>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">{t('settings.customize.itemCount')}</span>
                <span className="text-white ml-2">{selectedWishlist.items?.length || 0}{t('settings.customize.itemsCount')}</span>
              </div>
              <div>
                <span className="text-slate-400">{t('settings.customize.createdDate')}</span>
                <span className="text-white ml-2">{new Date(selectedWishlist.createdAt).toLocaleDateString('ko-KR')}</span>
              </div>
              <div>
                <span className="text-slate-400">{t('settings.customize.publicStatus')}</span>
                <span className={`ml-2 ${selectedWishlist.isPublic ? 'text-green-400' : 'text-orange-400'}`}>
                  {selectedWishlist.isPublic ? t('settings.customize.public') : t('settings.customize.private')}
                </span>
              </div>
              <div>
                <span className="text-slate-400">{t('settings.customize.customization')}</span>
                <span className="text-white ml-2">
                  {selectedWishlist.customization ? t('settings.customize.applied') : t('settings.customize.none')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}