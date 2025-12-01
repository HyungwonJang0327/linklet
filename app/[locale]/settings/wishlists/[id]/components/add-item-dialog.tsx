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
  const [productTitle, setProductTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!productUrl.trim()) {
      toast.error(t('item.productUrlRequired'))
      return
    }

    if (!productTitle.trim()) {
      toast.error(t('item.productTitleRequired') || '상품명을 입력해주세요')
      return
    }

    setIsLoading(true)
    let metadata = null
    let metadataFailed = false

    // Always attempt metadata extraction when button is clicked
    try {
      const metadataResponse = await fetch('/api/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: productUrl }),
      })

      if (metadataResponse.ok) {
        const response = await metadataResponse.json()
        if (response.success && response.data) {
          metadata = response.data
        } else {
          metadataFailed = true
        }
      } else {
        metadataFailed = true
      }
    } catch (error) {
      console.log('Metadata extraction failed, continuing with basic info:', error)
      metadataFailed = true
    }

    try {
      // Always add item regardless of metadata extraction result
      const createResponse = await fetch(`/api/wishlists/${wishlistId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: productTitle.trim(),
          productUrl: productUrl,
          imageUrl: metadata?.imageUrl || null,
          description: metadata?.description || null,
          price: metadata?.price || null,
        }),
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json()
        throw new Error(errorData.error || t('item.add.failed'))
      }

      // Show success message with guidance for manual editing if metadata failed
      if (metadataFailed) {
        toast.success(
          t('item.add.successWithoutMetadata') ||
          '상품이 추가되었습니다. 상품 정보를 수동으로 입력해주세요.',
          { duration: 5000 }
        )
      } else {
        toast.success(t('item.add.success'))
      }

      setProductUrl('')
      setProductTitle('')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Failed to add item:', error)
      toast.error(error instanceof Error ? error.message : t('item.add.failed'))
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">{t('item.add.title')}</h2>
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
              {t('item.productTitle')} <span className="text-red-400">*</span>
            </label>
            <Input
              type="text"
              value={productTitle}
              onChange={setProductTitle}
              placeholder={t('item.productTitlePlaceholder') || '상품명'}
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('item.productUrlLabel')} <span className="text-red-400">*</span>
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
              {t('item.productUrlHint')}
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
              disabled={!productUrl.trim() || !productTitle.trim() || isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? t('item.add.adding') : t('item.add.addButton')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
