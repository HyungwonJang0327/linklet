import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLinkIcon, TrashIcon, EditIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface WishlistItemCardProps {
  item: {
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
    wishlistId: string
  }
  isSharedView?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onToggleComplete?: () => void
  onView?: () => void
  isSelectionMode?: boolean
  isSelected?: boolean
  onSelect?: () => void
}

export function WishlistItemCard({
  item,
  isSharedView = false,
  onEdit,
  onDelete,
  onToggleComplete,
  onView,
  isSelectionMode = false,
  isSelected = false,
  onSelect
}: WishlistItemCardProps) {
  const handleCardClick = () => {
    if (isSelectionMode) {
      onSelect?.()
    } else if (!isSharedView && onView) {
      onView()
    }
  }

  const handleLinkClick = () => {
    window.open(item.productUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Card
      className={`overflow-hidden bg-slate-800/50 border-slate-700 backdrop-blur-sm transition-all ${
        item.isCompleted ? 'opacity-60' : ''
      } ${isSelectionMode || (!isSharedView && onView) ? 'cursor-pointer hover:border-blue-500' : ''} ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-500/50' : ''
      }`}
      onClick={handleCardClick}
    >
      {item.imageUrl && (
        <div className="aspect-video relative overflow-hidden bg-slate-700">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover"
            unoptimized
          />
          {/* Selection checkbox overlay on image */}
          {isSelectionMode && (
            <div className="absolute top-2 right-2 z-20">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => {}}
                onClick={(e) => e.stopPropagation()}
                className="w-6 h-6 rounded border-2 border-white bg-slate-700 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          )}
          {/* Completion overlay on image */}
          {item.isCompleted && !isSelectionMode && (
            <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
              <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                받음
              </span>
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {/* Selection checkbox (when no image) */}
              {isSelectionMode && !item.imageUrl && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  onClick={(e) => e.stopPropagation()}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                />
              )}
              {/* Completion checkbox */}
              {!isSharedView && !isSelectionMode && onToggleComplete && (
                <input
                  type="checkbox"
                  checked={item.isCompleted}
                  onChange={onToggleComplete}
                  onClick={(e) => e.stopPropagation()}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-green-600 focus:ring-2 focus:ring-green-500 cursor-pointer flex-shrink-0"
                  title={item.isCompleted ? '받음 취소' : '받음 처리'}
                />
              )}
              <h3 className={`font-semibold text-lg leading-tight line-clamp-2 text-white ${
                item.isCompleted ? 'line-through opacity-75' : ''
              }`}>
                {item.title}
              </h3>
            </div>
          </div>

          {!isSharedView && !isSelectionMode && (
            <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit()}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <EditIcon className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete()}
                  className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {item.description && (
          <p className={`text-slate-300 text-sm mb-3 line-clamp-2 ${
            item.isCompleted ? 'opacity-75' : ''
          }`}>
            {item.description}
          </p>
        )}

        {item.price && (
          <p className={`text-lg font-semibold mb-3 text-blue-400 ${
            item.isCompleted ? 'opacity-75' : ''
          }`}>
            {item.price}
          </p>
        )}

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLinkClick}
            className="flex items-center gap-2 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
          >
            <ExternalLinkIcon className="w-4 h-4" />
            상품 보기
          </Button>

          <span className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(item.createdAt), {
              addSuffix: true,
              locale: ko
            })}
          </span>
        </div>
      </div>
    </Card>
  )
}