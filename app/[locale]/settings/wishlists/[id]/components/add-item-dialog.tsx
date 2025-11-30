'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/lib/i18n/context'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'

interface AddItemDialogProps {
  wishlistId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddItemDialog({ wishlistId, isOpen, onClose, onSuccess }: AddItemDialogProps) {
  const { t } = useI18n()
  const [productUrl, setProductUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!productUrl.trim()) {
      toast.error('상품 URL을 입력해주세요')
      return
    }

    setIsLoading(true)

    try {
      // Extract metadata from URL
      const metadataResponse = await fetch('/api/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: productUrl }),
      })

      if (!metadataResponse.ok) {
        throw new Error('상품 정보를 가져올 수 없습니다')
      }

      const metadata = await metadataResponse.json()

      // Create wishlist item
      const createResponse = await fetch(`/api/wishlists/${wishlistId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: metadata.title || 'Untitled Product',
          productUrl: productUrl,
          imageUrl: metadata.images?.[0] || null,
          description: metadata.description || null,
          price: metadata.price || null,
        }),
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json()
        throw new Error(errorData.error || '아이템 추가에 실패했습니다')
      }

      toast.success('아이템이 추가되었습니다')
      setProductUrl('')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Failed to add item:', error)
      toast.error(error instanceof Error ? error.message : '아이템 추가에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">아이템 추가</h2>
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
              상품 URL
            </label>
            <Input
              type="url"
              value={productUrl}
              onChange={setProductUrl}
              placeholder="https://example.com/product"
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
              disabled={isLoading}
            />
            <p className="mt-2 text-sm text-slate-400">
              상품 페이지 URL을 입력하면 자동으로 정보를 가져옵니다
            </p>
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
              disabled={!productUrl.trim() || isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? '추가 중...' : '추가하기'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
