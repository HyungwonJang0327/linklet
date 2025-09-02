'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeftIcon, RectangleStackIcon, EyeIcon, EyeSlashIcon, LinkIcon, PlusIcon, TrashIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'

export default function CreateWishlistPage() {
  const { t } = useI18n()
  const router = useRouter()
  const { locale = 'kr' } = useParams()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublic: true,
    category: 'general'
  })

  const [productLinks, setProductLinks] = useState<string[]>([''])
  const [linkErrors, setLinkErrors] = useState<Record<number, string>>({})

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const categories = [
    { value: 'general', label: '일반' },
    { value: 'birthday', label: '생일선물' },
    { value: 'christmas', label: '크리스마스' },
    { value: 'wedding', label: '결혼선물' },
    { value: 'baby', label: '육아용품' },
    { value: 'electronics', label: '전자제품' },
    { value: 'fashion', label: '패션' },
    { value: 'books', label: '도서' },
    { value: 'travel', label: '여행' },
    { value: 'home', label: '홈데코' }
  ]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = '위시리스트 제목을 입력해주세요'
    } else if (formData.title.trim().length < 2) {
      newErrors.title = '제목은 2글자 이상 입력해주세요'
    } else if (formData.title.trim().length > 50) {
      newErrors.title = '제목은 50글자 이하로 입력해주세요'
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = '설명은 200글자 이하로 입력해주세요'
    }

    setErrors(newErrors)

    // Validate product links
    const linkValidationErrors: Record<number, string> = {}
    productLinks.forEach((link, index) => {
      if (link && !isValidUrl(link)) {
        linkValidationErrors[index] = '유효한 URL을 입력해주세요'
      }
    })
    setLinkErrors(linkValidationErrors)

    return Object.keys(newErrors).length === 0 && Object.keys(linkValidationErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      // TODO: API call to create wishlist
      const validLinks = productLinks.filter(link => link.trim() !== '')
      console.log('Creating wishlist:', { ...formData, productLinks: validLinks })

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Redirect back to wishlists page
      router.push(`/${locale}/settings/wishlists`)
    } catch (error) {
      console.error('Failed to create wishlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push(`/${locale}/settings/wishlists`)
  }

  const isValidUrl = (string: string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  const addProductLink = () => {
    if (productLinks.length < 10) {
      setProductLinks([...productLinks, ''])
    }
  }

  const removeProductLink = (index: number) => {
    if (productLinks.length > 1) {
      const newLinks = productLinks.filter((_, i) => i !== index)
      setProductLinks(newLinks)

      // Remove error for removed link
      const newErrors = { ...linkErrors }
      delete newErrors[index]
      setLinkErrors(newErrors)
    }
  }

  const updateProductLink = (index: number, value: string) => {
    const newLinks = [...productLinks]
    newLinks[index] = value
    setProductLinks(newLinks)

    // Clear error when user starts typing
    if (linkErrors[index]) {
      const newErrors = { ...linkErrors }
      delete newErrors[index]
      setLinkErrors(newErrors)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="text-slate-300 hover:text-white hover:bg-slate-700/50 p-2"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>

        <div>
          <h1 className="text-3xl font-bold text-white">{t('wishlist.create')}</h1>
          <p className="text-slate-300 mt-1">
            새로운 위시리스트를 만들어 원하는 상품들을 정리해보세요
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <RectangleStackIcon className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">기본 정보</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  위시리스트 제목 *
                </label>
                <Input
                  value={formData.title}
                  onChange={(value) => setFormData(prev => ({ ...prev, title: value }))}
                  placeholder="예: 2024년 생일 선물"
                  className={`bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400 ${errors.title ? 'border-red-500' : ''
                    }`}
                  disabled={loading}
                />
                {errors.title && (
                  <p className="text-red-400 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  설명 (선택사항)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="이 위시리스트에 대한 간단한 설명을 작성해주세요..."
                  disabled={loading}
                  rows={4}
                  className={`w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${errors.description ? 'border-red-500' : ''
                    }`}
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.description && (
                    <p className="text-red-400 text-sm">{errors.description}</p>
                  )}
                  <p className="text-slate-500 text-xs ml-auto">
                    {formData.description.length}/200
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  카테고리
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Product Links */}
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <GlobeAltIcon className="w-6 h-6 text-green-400" />
              <div>
                <h2 className="text-xl font-semibold text-white">상품 링크 추가 (선택사항)</h2>
                <p className="text-sm text-slate-400 mt-1">위시리스트 생성과 함께 원하는 상품들을 바로 추가해보세요</p>
              </div>
            </div>

            <div className="space-y-4">
              {productLinks.map((link, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      value={link}
                      onChange={(value) => updateProductLink(index, value)}
                      placeholder={`상품 링크 ${index + 1} (예: https://example.com/product)`}
                      className={`bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400 ${linkErrors[index] ? 'border-red-500' : ''
                        }`}
                      disabled={loading}
                    />
                    {linkErrors[index] && (
                      <p className="text-red-400 text-xs mt-1">{linkErrors[index]}</p>
                    )}
                  </div>

                  <div className="flex items-start gap-2">
                    {productLinks.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProductLink(index)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 h-10"
                        disabled={loading}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    )}

                    {index === productLinks.length - 1 && productLinks.length < 10 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addProductLink}
                        className="text-green-400 hover:text-green-300 hover:bg-green-500/10 p-2 h-10"
                        disabled={loading}
                      >
                        <PlusIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                <span>최대 10개의 상품 링크를 추가할 수 있습니다</span>
                <span>{productLinks.filter(link => link.trim()).length}/10</span>
              </div>

              {productLinks.length < 10 && productLinks.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addProductLink}
                  className="text-slate-300 border-slate-600 hover:bg-slate-700"
                  disabled={loading}
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  링크 추가
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Privacy Settings */}
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6">공개 설정</h2>

            <div className="space-y-4">
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${formData.isPublic
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-600 hover:border-slate-500'
                  }`}
                onClick={() => setFormData(prev => ({ ...prev, isPublic: true }))}
              >
                <div className="flex items-start gap-3">
                  <EyeIcon className={`w-5 h-5 mt-0.5 ${formData.isPublic ? 'text-blue-400' : 'text-slate-400'
                    }`} />
                  <div>
                    <div className={`font-medium ${formData.isPublic ? 'text-blue-300' : 'text-slate-200'
                      }`}>
                      공개 위시리스트
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      링크를 아는 사람이면 누구나 볼 수 있습니다
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${!formData.isPublic
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-600 hover:border-slate-500'
                  }`}
                onClick={() => setFormData(prev => ({ ...prev, isPublic: false }))}
              >
                <div className="flex items-start gap-3">
                  <EyeSlashIcon className={`w-5 h-5 mt-0.5 ${!formData.isPublic ? 'text-blue-400' : 'text-slate-400'
                    }`} />
                  <div>
                    <div className={`font-medium ${!formData.isPublic ? 'text-blue-300' : 'text-slate-200'
                      }`}>
                      비공개 위시리스트
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      나만 볼 수 있습니다
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={loading}
            className="text-slate-300 border-slate-600 hover:bg-slate-700"
          >
            취소
          </Button>
          <Button
            type="submit"
            loading={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {t('wishlist.create')}
          </Button>
        </div>
      </form>
    </div>
  )
}