'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { XMarkIcon, PencilIcon, TrashIcon as TrashIconHero } from '@heroicons/react/24/outline'
import { ExternalLinkIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface ItemDetailDialogProps {
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
  } | null
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

export function ItemDetailDialog({
  item,
  isOpen,
  onClose,
  onEdit,
  onDelete
}: ItemDetailDialogProps) {
  if (!isOpen || !item) return null

  const handleLinkClick = () => {
    window.open(item.productUrl, '_blank', 'noopener,noreferrer')
  }

  // 우선순위 관련 함수 - 나중에 다시 사용할 수 있도록 주석처리
  // const getPriorityLabel = (priority: number) => {
  //   if (priority >= 4) return { label: '높음', color: 'bg-red-500/20 text-red-400' }
  //   if (priority >= 2) return { label: '중간', color: 'bg-yellow-500/20 text-yellow-400' }
  //   if (priority >= 1) return { label: '낮음', color: 'bg-slate-500/20 text-slate-400' }
  //   return null
  // }
  // const priorityInfo = getPriorityLabel(item.priority)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-900 z-10">
          <h2 className="text-xl font-bold text-white">아이템 상세</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image */}
          {item.imageUrl && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-800">
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {/* Title and Status Badges */}
          <div>
            <div className="flex items-start gap-3 mb-3">
              <h3 className="text-2xl font-bold text-white flex-1">{item.title}</h3>
              {item.isCompleted && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-600 text-white">
                  받음
                </span>
              )}
            </div>

            {/* 우선순위 표시 - 나중에 다시 사용할 수 있도록 주석처리 */}
            {/* <div className="flex items-center gap-2">
              {priorityInfo && (
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${priorityInfo.color}`}>
                  우선순위: {priorityInfo.label}
                </span>
              )}
            </div> */}
          </div>

          {/* Description */}
          {item.description && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">설명</h4>
              <p className="text-slate-200 whitespace-pre-wrap">{item.description}</p>
            </div>
          )}

          {/* Price */}
          {item.price && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">가격</h4>
              <p className="text-2xl font-bold text-blue-400">{item.price}</p>
            </div>
          )}

          {/* Product URL */}
          <div>
            <h4 className="text-sm font-medium text-slate-400 mb-2">상품 링크</h4>
            <Button
              onClick={handleLinkClick}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ExternalLinkIcon className="w-5 h-5 mr-2" />
              상품 페이지 열기
            </Button>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-1">생성일</h4>
              <p className="text-sm text-slate-300">
                {formatDistanceToNow(new Date(item.createdAt), {
                  addSuffix: true,
                  locale: ko
                })}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-1">수정일</h4>
              <p className="text-sm text-slate-300">
                {formatDistanceToNow(new Date(item.updatedAt), {
                  addSuffix: true,
                  locale: ko
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 p-6 border-t border-slate-700 bg-slate-800/50">
          <Button
            onClick={onEdit}
            variant="outline"
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <PencilIcon className="w-4 h-4 mr-2" />
            편집
          </Button>
          <Button
            onClick={onDelete}
            variant="outline"
            className="flex-1 border-red-600 text-red-400 hover:bg-red-900/20"
          >
            <TrashIconHero className="w-4 h-4 mr-2" />
            삭제
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white"
          >
            닫기
          </Button>
        </div>
      </div>
    </div>
  )
}
