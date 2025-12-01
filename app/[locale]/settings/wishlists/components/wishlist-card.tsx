'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PencilIcon, TrashIcon, Bars3Icon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'
import { formatRelativeTime } from '@/lib/utils'
import { useRouter, useParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

interface WishlistCardProps {
  wishlist: {
    id: string
    title: string
    description: string | null
    isPublic: boolean
    createdAt: string | Date
    _count?: {
      items: number
    }
  }
  onDelete?: () => void
}

export default function WishlistCard({ wishlist, onDelete }: WishlistCardProps) {
  const { t } = useI18n()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string || 'kr'
  const [isDeleting, setIsDeleting] = useState(false)

  const handleCardClick = () => {
    router.push(`/${locale}/settings/wishlists/${wishlist.id}`)
  }

  const handleEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    router.push(`/${locale}/settings/wishlists/${wishlist.id}`)
  }

  const handleDelete = async (e?: React.MouseEvent) => {
    e?.stopPropagation()

    if (!confirm(t('wishlist.delete.confirm', { title: wishlist.title }))) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/wishlists/${wishlist.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(t('wishlist.delete.failed'))
      }

      toast.success(t('wishlist.delete.success'))

      // Call parent callback to refresh the list
      if (onDelete) {
        onDelete()
      }
    } catch (error) {
      console.error('Failed to delete wishlist:', error)
      toast.error(error instanceof Error ? error.message : t('wishlist.delete.failed'))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card
      className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm hover:bg-slate-700/50 transition-all duration-200 hover:border-slate-600/50 group cursor-pointer"
      onClick={handleCardClick}
    >
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
              onClick={handleEdit}
              className="text-slate-400 hover:text-white hover:bg-slate-700"
              title={t('common.edit') || '편집'}
            >
              <PencilIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50"
              title={t('common.delete') || '삭제'}
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
          <span>{wishlist._count?.items || 0} {t('wishlist.items')}</span>
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
            onClick={handleEdit}
            className="flex-1 text-slate-300 border-slate-600 hover:bg-slate-700"
          >
            {t('common.edit')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <Bars3Icon className="w-4 h-4" />
          </Button>
        </div>

        {/* Creation Date */}
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <span className="text-xs text-slate-500">
            {t('wishlist.created')}: {formatRelativeTime(wishlist.createdAt, locale as 'kr' | 'en' | 'jp')}
          </span>
        </div>
      </div>
    </Card>
  )
}