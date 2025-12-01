'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/lib/i18n/context'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { useUrlMetadata } from '@/hooks/use-url-metadata'
import { Loader2 } from 'lucide-react'
import ImageUpload from '@/components/ui/image-upload'
import { formatNumberInput } from '@/lib/utils/format'

interface EditItemDialogProps {
  item: {
    id: string
    title: string
    description?: string | null
    productUrl: string
    imageUrl?: string | null
    price?: string | null
    priority?: number
  } | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditItemDialog({ item, isOpen, onClose, onSuccess }: EditItemDialogProps) {
  const { t } = useI18n()
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [productUrl, setProductUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [priority, setPriority] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [urlInputValue, setUrlInputValue] = useState('')

  const { extractMetadata, isLoading: isMetadataLoading } = useUrlMetadata()

  useEffect(() => {
    if (item) {
      setTitle(item.title)
      setPrice(item.price || '')
      setDescription(item.description || '')
      setProductUrl(item.productUrl)
      setImageUrl(item.imageUrl || '')
      setPriority(item.priority || 0)
      setUrlInputValue(item.productUrl)
    }
  }, [item])

  const handleUrlExtract = async () => {
    if (!urlInputValue.trim()) {
      toast.error(t('item.edit.urlInputRequired'))
      return
    }

    try {
      const result = await extractMetadata(urlInputValue.trim())

      if (result.success && result.data) {
        setProductUrl(urlInputValue.trim())

        // 메타데이터로 필드 자동 채우기 (기존 값이 없을 경우에만)
        if (!title && result.data.title) {
          setTitle(result.data.title)
        }
        if (!description && result.data.description) {
          setDescription(result.data.description)
        }
        if (!imageUrl && result.data.imageUrl) {
          setImageUrl(result.data.imageUrl)
        }
        if (!price && result.data.price) {
          setPrice(result.data.price)
        }

        toast.success(t('item.edit.fetchSuccess'))
      } else {
        // 메타데이터 추출 실패해도 URL은 저장
        setProductUrl(urlInputValue.trim())
        toast.warning(t('item.edit.fetchWarning'))
      }
    } catch (error) {
      console.error('Failed to extract metadata:', error)
      // 에러 발생해도 URL은 저장
      setProductUrl(urlInputValue.trim())
      toast.warning(t('item.edit.fetchWarning'))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!item || !title.trim()) {
      toast.error(t('item.edit.titleRequired'))
      return
    }

    if (!productUrl.trim()) {
      toast.error(t('item.edit.productUrlRequired'))
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          price: price.trim() || null,
          description: description.trim() || null,
          productUrl: productUrl.trim(),
          imageUrl: imageUrl.trim() || null,
          priority: priority || 0, // 우선순위 기본값 0
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || t('item.edit.updateError'))
      }

      toast.success(t('item.edit.updateSuccess'))
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Failed to update item:', error)
      toast.error(error instanceof Error ? error.message : t('item.edit.updateError'))
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-900 z-20">
          <h2 className="text-xl font-bold text-white">{t('item.edit.title')}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 상품 URL */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('item.edit.productUrlLabel')} *
            </label>
            <div className="flex gap-2">
              <Input
                type="url"
                value={urlInputValue}
                onChange={setUrlInputValue}
                placeholder="https://example.com/product"
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 flex-1"
                disabled={isLoading || isMetadataLoading}
              />
              <Button
                type="button"
                onClick={handleUrlExtract}
                disabled={isLoading || isMetadataLoading || !urlInputValue.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
              >
                {isMetadataLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('item.edit.fetching')}
                  </>
                ) : (
                  t('item.edit.fetchInfo')
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {t('item.edit.fetchHint')}
            </p>
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('item.edit.titleLabel')} *
            </label>
            <Input
              type="text"
              value={title}
              onChange={setTitle}
              placeholder={t('item.edit.titlePlaceholder')}
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
              disabled={isLoading}
            />
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('item.edit.imageLabel')}
            </label>
            <ImageUpload
              value={imageUrl}
              onChange={(url) => setImageUrl(url || '')}
              placeholder={t('item.edit.imagePlaceholder')}
              disabled={isLoading}
              maxSizeKB={5120}
              preview={true}
            />
            <p className="text-xs text-slate-400 mt-1">
              {t('item.edit.imageHint')}
            </p>
          </div>

          {/* 가격 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('item.edit.priceLabel')}
            </label>
            <Input
              type="text"
              value={price}
              onChange={(value) => setPrice(formatNumberInput(value))}
              placeholder={t('item.edit.pricePlaceholder')}
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
              disabled={isLoading}
            />
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('item.edit.descriptionLabel')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('item.edit.descriptionPlaceholder')}
              rows={3}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>

          {/* 우선순위 입력 필드 - 나중에 다시 사용할 수 있도록 주석처리 */}
          {/* <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              우선순위
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value={0}>설정 안함</option>
              <option value={1}>낮음</option>
              <option value={3}>중간</option>
              <option value={5}>높음</option>
            </select>
          </div> */}

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
              disabled={!title.trim() || !productUrl.trim() || isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? t('item.edit.saving') : t('item.edit.saveButton')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
