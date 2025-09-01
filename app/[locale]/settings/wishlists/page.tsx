'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusIcon, PencilIcon, TrashIcon, Bars3Icon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'

export default function WishlistsManagePage() {
  const { t } = useI18n()
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

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('settings.wishlists.manage')}</h1>
          <p className="text-slate-300">
            {t('settings.wishlists.manageDesc')}
          </p>
        </div>
        
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <PlusIcon className="w-4 h-4 mr-2" />
          {t('wishlist.create')}
        </Button>
      </div>

      {/* Wishlists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {wishlists.map((wishlist) => (
          <Card key={wishlist.id} className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-1 truncate">
                    {wishlist.title}
                  </h3>
                  <p className="text-sm text-slate-400 line-clamp-2">
                    {wishlist.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-1 ml-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white hover:bg-slate-700"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
                <span>{wishlist.itemCount} {t('wishlist.items')}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  wishlist.isPublic 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {wishlist.isPublic ? t('wishlist.public') : t('wishlist.private')}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 text-slate-300 border-slate-600 hover:bg-slate-700"
                >
                  {t('common.edit')}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <Bars3Icon className="w-4 h-4" />
                </Button>
              </div>

              {/* Creation Date */}
              <div className="mt-3 pt-3 border-t border-slate-700/50">
                <span className="text-xs text-slate-500">
                  {t('wishlist.created')}: {wishlist.createdAt}
                </span>
              </div>
            </div>
          </Card>
        ))}

        {/* Add New Wishlist Card */}
        <Card className="bg-slate-800/30 border-slate-700/30 border-dashed backdrop-blur-sm">
          <div className="p-6 flex flex-col items-center justify-center min-h-[280px] text-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
              <PlusIcon className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              {t('wishlist.create')}
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              새로운 위시리스트를 만들어보세요
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <PlusIcon className="w-4 h-4 mr-2" />
              {t('common.add')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}