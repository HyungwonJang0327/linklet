'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/lib/i18n/context'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'

const CATEGORIES = [
  'GENERAL',
  'BIRTHDAY',
  'CHRISTMAS',
  'WEDDING',
  'BABY',
  'ELECTRONICS',
  'FASHION',
  'BOOKS',
  'TRAVEL',
  'HOME',
] as const

interface EditWishlistDialogProps {
  wishlist: {
    id: string
    title: string
    description?: string | null
    category: string
    isPublic: boolean
  } | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditWishlistDialog({
  wishlist,
  isOpen,
  onClose,
  onSuccess
}: EditWishlistDialogProps) {
  const { t } = useI18n()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('GENERAL')
  const [isPublic, setIsPublic] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (wishlist) {
      setTitle(wishlist.title)
      setDescription(wishlist.description || '')
      setCategory(wishlist.category)
      setIsPublic(wishlist.isPublic)
    }
  }, [wishlist])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!wishlist || !title.trim()) {
      toast.error('제목을 입력해주세요')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/wishlists/${wishlist.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          category,
          isPublic,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '수정에 실패했습니다')
      }

      toast.success('위시리스트가 수정되었습니다')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Failed to update wishlist:', error)
      toast.error(error instanceof Error ? error.message : '수정에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !wishlist) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">위시리스트 수정</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              제목 *
            </label>
            <Input
              type="text"
              value={title}
              onChange={setTitle}
              placeholder="위시리스트 제목"
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="위시리스트 설명"
              rows={3}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              카테고리
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`wishlist.categories.${cat}`) || cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <label htmlFor="isPublic" className="text-sm text-slate-300">
              공개 위시리스트로 설정
            </label>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 border-slate-600 text-slate-300"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              disabled={!title.trim() || isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? '저장 중...' : '저장하기'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
