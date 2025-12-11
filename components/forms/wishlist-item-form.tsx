'use client'

import React, { useState } from 'react'
import { Plus, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { isValidUrl } from '@/lib/utils'
import { formatNumberInput } from '@/lib/utils/format'
import { useI18n } from '@/lib/i18n/context'
import type { CreateWishlistItemRequest, WishlistItem } from '@/lib/types'

interface WishlistItemFormProps {
  onSubmit: (data: CreateWishlistItemRequest) => Promise<void>
  initialData?: Partial<WishlistItem>
  loading?: boolean
  submitText?: string
}

export function WishlistItemForm({
  onSubmit,
  initialData = {},
  loading = false,
  submitText
}: WishlistItemFormProps) {
  const { t } = useI18n()
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    productUrl: initialData.productUrl || '',
    imageUrl: initialData.imageUrl || '',
    price: initialData.price || '',
    priority: initialData.priority || 0
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = t('item.form.productNameRequired')
    }

    if (!formData.productUrl.trim()) {
      newErrors.productUrl = t('item.form.productLinkRequired')
    } else if (!isValidUrl(formData.productUrl)) {
      newErrors.productUrl = t('item.form.productLinkInvalid')
    }

    if (formData.imageUrl && !isValidUrl(formData.imageUrl)) {
      newErrors.imageUrl = t('item.form.imageUrlInvalid')
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setErrors({})
    
    try {
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        productUrl: formData.productUrl.trim(),
        imageUrl: formData.imageUrl.trim() || undefined,
        price: formData.price.trim() || undefined,
        priority: formData.priority || 0 // 우선순위 기본값 0
      })
      
      // Reset form after successful submission
      setFormData({
        title: '',
        description: '',
        productUrl: '',
        imageUrl: '',
        price: '',
        priority: 0
      })
    } catch (error) {
      console.error('Failed to add item:', error)
    }
  }

  return (
    <Card padding="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('item.form.newItemTitle')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('item.form.newItemSubtitle')}
            </p>
          </div>
        </div>

        <Input
          label={t('item.form.productName')}
          placeholder={t('item.form.titlePlaceholder')}
          value={formData.title}
          onChange={(value: string) => setFormData(prev => ({ ...prev, title: value }))}
          required
          error={errors.title}
          disabled={loading}
        />

        <div>
          <div className="flex items-center gap-2 mb-2">
            <LinkIcon className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('item.form.productLink')} <span className="text-red-500">*</span>
            </label>
          </div>
          <Input
            type="url"
            placeholder={t('item.form.urlPlaceholder')}
            value={formData.productUrl}
            onChange={(value: string) => setFormData(prev => ({ ...prev, productUrl: value }))}
            required
            error={errors.productUrl}
            disabled={loading}
          />
        </div>

        <Input
          label={t('item.form.descriptionOptional')}
          placeholder={t('item.form.descriptionPlaceholder')}
          value={formData.description}
          onChange={(value: string) => setFormData(prev => ({ ...prev, description: value }))}
          disabled={loading}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('item.form.imageUrlOptional')}
            type="url"
            placeholder={t('item.form.imagePlaceholder')}
            value={formData.imageUrl}
            onChange={(value: string) => setFormData(prev => ({ ...prev, imageUrl: value }))}
            error={errors.imageUrl}
            disabled={loading}
          />

          <Input
            label={t('item.form.priceOptional')}
            placeholder={t('item.form.pricePlaceholder')}
            value={formData.price}
            onChange={(value: string) => {
              // Format as user types - only allow numbers and auto-format with commas
              const formatted = formatNumberInput(value)
              setFormData(prev => ({ ...prev, price: formatted }))
            }}
            disabled={loading}
          />
        </div>

        <Button
          type="submit"
          loading={loading}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          {submitText || t('item.form.submitText')}
        </Button>
      </form>
    </Card>
  )
}