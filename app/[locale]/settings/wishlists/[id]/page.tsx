'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { useWishlistById } from '@/hooks/use-wishlist'
import { useI18n } from '@/lib/i18n/context'
import { Loading } from '@/components/ui/loading'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { WishlistItemCard } from '@/components/wishlist/wishlist-item-card'
import { AddItemDialog } from './components/add-item-dialog'
import { EditItemDialog } from './components/edit-item-dialog'
import { SortableItem } from './components/sortable-item'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  ArrowLeftIcon,
  ShareIcon,
  PencilIcon,
  PlusIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { formatRelativeTime } from '@/lib/utils'

export default function WishlistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useI18n()
  const { isAuthenticated } = useAuth()

  const wishlistId = params.id as string
  const locale = params.locale as string || 'kr'

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<{
    id: string
    title: string
    description?: string | null
    productUrl: string
    price?: string | null
  } | null>(null)

  const { data: wishlist, isLoading, error, refetch } = useWishlistById(wishlistId)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleCopyShareLink = () => {
    if (!wishlist?.shareUrl) return

    const shareUrl = `${window.location.origin}/w/${wishlist.shareUrl}`
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast.success('공유 링크가 복사되었습니다')
      })
      .catch(() => {
        toast.error('링크 복사에 실패했습니다')
      })
  }

  const handleBack = () => {
    router.push(`/${locale}/settings/wishlists`)
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

  if (error || !wishlist) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-red-400 mb-4">
          {t('common.error')}
        </h2>
        <p className="text-slate-300 mb-6">
          {error instanceof Error ? error.message : '위시리스트를 불러올 수 없습니다'}
        </p>
        <Button onClick={handleBack}>
          {t('common.back')}
        </Button>
      </div>
    )
  }

  const items = wishlist.items || []
  const completedCount = items.filter(item => item.isCompleted).length
  const totalCount = items.length

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('이 아이템을 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('삭제에 실패했습니다')
      }

      toast.success('아이템이 삭제되었습니다')
      refetch()
    } catch (error) {
      console.error('Failed to delete item:', error)
      toast.error(error instanceof Error ? error.message : '삭제에 실패했습니다')
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // Optimistically update UI
    const newItems = arrayMove(items, oldIndex, newIndex)
    const itemIds = newItems.map(item => item.id)

    try {
      const response = await fetch(`/api/wishlists/${wishlistId}/items/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds }),
      })

      if (!response.ok) {
        throw new Error('순서 변경에 실패했습니다')
      }

      refetch()
    } catch (error) {
      console.error('Failed to reorder items:', error)
      toast.error(error instanceof Error ? error.message : '순서 변경에 실패했습니다')
      refetch() // Revert to server state
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          {t('common.back')}
        </Button>
      </div>

      {/* Wishlist Info Card */}
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">
                {wishlist.title}
              </h1>
              {wishlist.description && (
                <p className="text-slate-300 text-lg">
                  {wishlist.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyShareLink}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ShareIcon className="w-4 h-4 mr-2" />
                공유 링크 복사
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                {t('common.edit')}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{totalCount}</div>
              <div className="text-sm text-slate-400">총 아이템</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{completedCount}</div>
              <div className="text-sm text-slate-400">완료</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
              </div>
              <div className="text-sm text-slate-400">완료율</div>
            </div>
            <div className="text-center">
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                wishlist.isPublic
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-slate-500/20 text-slate-400'
              }`}>
                {wishlist.isPublic ? t('wishlist.public') : t('wishlist.private')}
              </div>
              <div className="text-sm text-slate-400 mt-1">상태</div>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-700/50 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4" />
              <span>생성: {formatRelativeTime(wishlist.createdAt)}</span>
            </div>
            {wishlist.category && (
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                  {t(`wishlist.categories.${wishlist.category}`) || wishlist.category}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Items Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            아이템 목록 ({totalCount})
          </h2>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            아이템 추가
          </Button>
        </div>

        {items.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <div className="p-12 text-center">
              <p className="text-slate-400 text-lg mb-4">
                {t('wishlist.noItems')}
              </p>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                첫 아이템 추가하기
              </Button>
            </div>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <SortableItem key={item.id} id={item.id}>
                    {(dragHandleProps) => (
                      <div className="relative">
                        <div
                          ref={dragHandleProps.ref}
                          {...dragHandleProps.listeners}
                          {...dragHandleProps.attributes}
                          className="absolute top-2 left-2 z-10 p-1 rounded cursor-grab active:cursor-grabbing bg-slate-700/80 hover:bg-slate-600/80 transition-colors"
                          title="드래그하여 순서 변경"
                        >
                          <GripVertical className="w-4 h-4 text-slate-300" />
                        </div>
                        <WishlistItemCard
                          item={item}
                          isSharedView={false}
                          onEdit={() => {
                            setEditingItem({
                              id: item.id,
                              title: item.title,
                              description: item.description,
                              productUrl: item.productUrl,
                              price: item.price,
                            })
                          }}
                          onDelete={() => handleDeleteItem(item.id)}
                        />
                      </div>
                    )}
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Add Item Dialog */}
      <AddItemDialog
        wishlistId={wishlistId}
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* Edit Item Dialog */}
      <EditItemDialog
        item={editingItem}
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSuccess={() => refetch()}
      />
    </div>
  )
}
