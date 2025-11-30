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
}

export function WishlistItemCard({
  item,
  isSharedView = false,
  onEdit,
  onDelete
}: WishlistItemCardProps) {
  const handleLinkClick = () => {
    window.open(item.productUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Card className="overflow-hidden bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      {item.imageUrl && (
        <div className="aspect-video relative overflow-hidden bg-slate-700">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg leading-tight line-clamp-2 text-white">
            {item.title}
          </h3>
          
          {!isSharedView && (
            <div className="flex gap-1 ml-2">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <EditIcon className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {item.description && (
          <p className="text-slate-300 text-sm mb-3 line-clamp-2">
            {item.description}
          </p>
        )}

        {item.price && (
          <p className="text-lg font-semibold mb-3 text-blue-400">
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