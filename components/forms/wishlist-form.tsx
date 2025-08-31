'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import type { CreateWishlistRequest, Wishlist } from '@/lib/types'

interface WishlistFormProps {
  onSubmit: (data: CreateWishlistRequest) => Promise<void>
  initialData?: Partial<Wishlist>
  loading?: boolean
  submitText?: string
}

export function WishlistForm({
  onSubmit,
  initialData = {},
  loading = false,
  submitText = '위시리스트 만들기'
}: WishlistFormProps) {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    description: initialData.description || ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const newErrors: Record<string, string> = {}
    
    if (!formData.title.trim()) {
      newErrors.title = '위시리스트 제목을 입력해주세요'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setErrors({})
    
    try {
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined
      })
    } catch (error) {
      console.error('Failed to save wishlist:', error)
    }
  }

  return (
    <Card padding="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            새 위시리스트 만들기
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            원하는 상품들을 모아서 위시리스트를 만들어보세요
          </p>
        </div>

        <Input
          label="위시리스트 제목"
          placeholder="예: 생일 선물 위시리스트"
          value={formData.title}
          onChange={(value: string) => setFormData(prev => ({ ...prev, title: value }))}
          required
          error={errors.title}
          disabled={loading}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            설명 (선택사항)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="위시리스트에 대한 간단한 설명을 입력해주세요"
            rows={3}
            disabled={loading}
            className="w-full px-3 py-2 border rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            loading={loading}
            className="flex-1"
          >
            {submitText}
          </Button>
        </div>
      </form>
    </Card>
  )
}