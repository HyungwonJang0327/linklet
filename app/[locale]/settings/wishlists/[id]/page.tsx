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
import { EditWishlistDialog } from './components/edit-wishlist-dialog'
import { ItemDetailDialog } from './components/item-detail-dialog'
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
  ClockIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  TrashIcon as TrashIconHero,
  XMarkIcon
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
  const [isEditWishlistDialogOpen, setIsEditWishlistDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price-high' | 'price-low' | 'name'>('newest')
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())
  const [editingItem, setEditingItem] = useState<{
    id: string
    title: string
    description?: string | null
    productUrl: string
    price?: string | null
    priority?: number
  } | null>(null)
  const [viewingItem, setViewingItem] = useState<{
    id: string
    title: string
    description?: string | null
    productUrl: string
    imageUrl?: string | null
    price?: string | null
    priority: number
    isCompleted: boolean
    createdAt: string | Date
    updatedAt: string | Date
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

  // 검색어 + 상태로 필터링
  const filteredItems = items.filter(item => {
    // 검색어 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const titleMatch = item.title.toLowerCase().includes(query)
      const descriptionMatch = item.description?.toLowerCase().includes(query)
      if (!titleMatch && !descriptionMatch) return false
    }

    // 상태 필터
    if (filterStatus === 'completed' && !item.isCompleted) return false
    if (filterStatus === 'pending' && item.isCompleted) return false

    return true
  })

  // 정렬
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'price-high': {
        const priceA = a.price ? parseFloat(a.price.replace(/[^\d.]/g, '')) : 0
        const priceB = b.price ? parseFloat(b.price.replace(/[^\d.]/g, '')) : 0
        return priceB - priceA
      }
      case 'price-low': {
        const priceA = a.price ? parseFloat(a.price.replace(/[^\d.]/g, '')) : 0
        const priceB = b.price ? parseFloat(b.price.replace(/[^\d.]/g, '')) : 0
        return priceA - priceB
      }
      case 'name':
        return a.title.localeCompare(b.title, 'ko')
      default:
        return 0
    }
  })

  const completedCount = items.filter(item => item.isCompleted).length
  const totalCount = items.length

  // 총 금액 계산
  const totalPrice = items.reduce((sum, item) => {
    if (!item.price) return sum
    // 숫자만 추출하여 합산 (쉼표, 원화 기호 등 제거)
    const numericPrice = parseFloat(item.price.replace(/[^\d.]/g, ''))
    return sum + (isNaN(numericPrice) ? 0 : numericPrice)
  }, 0)

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

  const handleToggleComplete = async (itemId: string) => {
    try {
      const response = await fetch(`/api/items/${itemId}/toggle-complete`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('상태 변경에 실패했습니다')
      }

      toast.success(t('wishlist.status.statusChanged'))
      refetch()
    } catch (error) {
      console.error('Failed to toggle completion:', error)
      toast.error(error instanceof Error ? error.message : '상태 변경에 실패했습니다')
    }
  }

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode)
    setSelectedItemIds(new Set())
  }

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItemIds)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItemIds(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedItemIds.size === sortedItems.length) {
      setSelectedItemIds(new Set())
    } else {
      setSelectedItemIds(new Set(sortedItems.map(item => item.id)))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedItemIds.size === 0) return

    if (!confirm(`선택한 ${selectedItemIds.size}개의 아이템을 삭제하시겠습니까?`)) {
      return
    }

    try {
      const deletePromises = Array.from(selectedItemIds).map(itemId =>
        fetch(`/api/items/${itemId}`, { method: 'DELETE' })
      )

      const results = await Promise.all(deletePromises)
      const failedCount = results.filter(r => !r.ok).length

      if (failedCount > 0) {
        throw new Error(`${failedCount}개 아이템 삭제에 실패했습니다`)
      }

      toast.success(`${selectedItemIds.size}개 아이템이 삭제되었습니다`)
      setSelectedItemIds(new Set())
      setIsSelectionMode(false)
      refetch()
    } catch (error) {
      console.error('Failed to delete selected items:', error)
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
                onClick={() => setIsEditWishlistDialogOpen(true)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                {t('common.edit')}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-slate-700/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{totalCount}</div>
              <div className="text-sm text-slate-400">총 아이템</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{completedCount}</div>
              <div className="text-sm text-slate-400">{t('wishlist.status.received')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
              </div>
              <div className="text-sm text-slate-400">{t('wishlist.status.received')} 비율</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {totalPrice > 0 ? totalPrice.toLocaleString() : '-'}
              </div>
              <div className="text-sm text-slate-400">총 금액</div>
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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-2xl font-bold text-white">
            아이템 목록 ({sortedItems.length}/{totalCount})
          </h2>
          <div className="flex items-center gap-3 flex-wrap">
            {!isSelectionMode ? (
              <>
                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="newest">최신순</option>
                  <option value="oldest">오래된순</option>
                  <option value="price-high">가격 높은순</option>
                  <option value="price-low">가격 낮은순</option>
                  <option value="name">이름순</option>
                </select>

                {/* Status Filter */}
                <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-lg">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      filterStatus === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t('wishlist.status.all')}
                  </button>
                  <button
                    onClick={() => setFilterStatus('completed')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      filterStatus === 'completed'
                        ? 'bg-green-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t('wishlist.status.received')}
                  </button>
                  <button
                    onClick={() => setFilterStatus('pending')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      filterStatus === 'pending'
                        ? 'bg-orange-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t('wishlist.status.wishlist')}
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="검색..."
                    className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                  />
                </div>

                <Button
                  onClick={handleToggleSelectionMode}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <CheckIcon className="w-4 h-4 mr-2" />
                  선택
                </Button>

                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  아이템 추가
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-500">
                  <span className="text-blue-400 font-medium">
                    {selectedItemIds.size}개 선택됨
                  </span>
                </div>

                <Button
                  onClick={handleSelectAll}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <CheckIcon className="w-4 h-4 mr-2" />
                  {selectedItemIds.size === sortedItems.length ? '전체 해제' : '전체 선택'}
                </Button>

                <Button
                  onClick={handleDeleteSelected}
                  disabled={selectedItemIds.size === 0}
                  className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrashIconHero className="w-4 h-4 mr-2" />
                  선택 삭제
                </Button>

                <Button
                  onClick={handleToggleSelectionMode}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <XMarkIcon className="w-4 h-4 mr-2" />
                  취소
                </Button>
              </>
            )}
          </div>
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
        ) : sortedItems.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <div className="p-12 text-center">
              <p className="text-slate-400 text-lg">
                검색 결과가 없습니다
              </p>
            </div>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedItems.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedItems.map((item) => (
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
                          onView={() => setViewingItem(item)}
                          onEdit={() => {
                            setEditingItem({
                              id: item.id,
                              title: item.title,
                              description: item.description,
                              productUrl: item.productUrl,
                              price: item.price,
                              priority: item.priority,
                            })
                          }}
                          onDelete={() => handleDeleteItem(item.id)}
                          onToggleComplete={() => handleToggleComplete(item.id)}
                          isSelectionMode={isSelectionMode}
                          isSelected={selectedItemIds.has(item.id)}
                          onSelect={() => handleSelectItem(item.id)}
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

      {/* Item Detail Dialog */}
      <ItemDetailDialog
        item={viewingItem}
        isOpen={!!viewingItem}
        onClose={() => setViewingItem(null)}
        onEdit={() => {
          if (viewingItem) {
            setEditingItem({
              id: viewingItem.id,
              title: viewingItem.title,
              description: viewingItem.description,
              productUrl: viewingItem.productUrl,
              price: viewingItem.price,
              priority: viewingItem.priority,
            })
            setViewingItem(null)
          }
        }}
        onDelete={() => {
          if (viewingItem) {
            handleDeleteItem(viewingItem.id)
            setViewingItem(null)
          }
        }}
      />

      {/* Edit Item Dialog */}
      <EditItemDialog
        item={editingItem}
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSuccess={() => refetch()}
      />

      {/* Edit Wishlist Dialog */}
      <EditWishlistDialog
        wishlist={wishlist ? {
          id: wishlist.id,
          title: wishlist.title,
          description: wishlist.description,
          category: wishlist.category,
          isPublic: wishlist.isPublic,
        } : null}
        isOpen={isEditWishlistDialogOpen}
        onClose={() => setIsEditWishlistDialogOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  )
}
