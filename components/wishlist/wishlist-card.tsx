import { Wishlist } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShareIcon, EditIcon, TrashIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface WishlistCardProps {
  wishlist: Wishlist
  isSharedView?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onShare?: () => void
}

export function WishlistCard({ 
  wishlist, 
  isSharedView = false,
  onEdit,
  onDelete,
  onShare
}: WishlistCardProps) {
  return (
    <Card className="p-6 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-white">{wishlist.title}</h1>
          {wishlist.description && (
            <p className="text-slate-300 mb-4">{wishlist.description}</p>
          )}
        </div>
        
        {!isSharedView && (
          <div className="flex gap-2">
            {wishlist.shareUrl && onShare && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onShare}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                <ShareIcon className="w-4 h-4" />
              </Button>
            )}
            {onEdit && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onEdit}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                <EditIcon className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onDelete}
                className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-slate-400">
        <span>
          생성일: {formatDistanceToNow(new Date(wishlist.createdAt), { 
            addSuffix: true,
            locale: ko 
          })}
        </span>
        <span>
          아이템: {wishlist.items?.length || 0}개
        </span>
        {wishlist.shareUrl && !isSharedView && (
          <span className="text-green-400">공유 가능</span>
        )}
        {!wishlist.shareUrl && !isSharedView && (
          <span className="text-amber-400">개인용</span>
        )}
      </div>

      {isSharedView && wishlist.user && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-sm text-slate-400">
            {wishlist.user.name}님의 위시리스트
          </p>
        </div>
      )}
    </Card>
  )
}