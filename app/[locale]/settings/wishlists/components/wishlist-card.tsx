'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PencilIcon, TrashIcon, Bars3Icon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'

interface WishlistCardProps {
  wishlist: {
    id: number
    title: string
    description: string
    itemCount: number
    isPublic: boolean
    createdAt: string
  }
}

export default function WishlistCard({ wishlist }: WishlistCardProps) {
  const { t } = useI18n()

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
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
  )
}