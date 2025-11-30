'use client'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { RectangleStackIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'

interface BasicInformationProps {
  formData: {
    title: string
    description: string
    category: string
  }
  setFormData: React.Dispatch<React.SetStateAction<{
    title: string
    description: string
    isPublic: boolean
    category: string
  }>>
  errors: Record<string, string>
  loading: boolean
}

export default function BasicInformation({ formData, setFormData, errors, loading }: BasicInformationProps) {
  const { t } = useI18n()

  const categories = [
    { value: 'general', label: t('wishlist.categories.general') || '일반' },
    { value: 'birthday', label: t('wishlist.categories.birthday') || '생일선물' },
    { value: 'christmas', label: t('wishlist.categories.christmas') || '크리스마스' },
    { value: 'wedding', label: t('wishlist.categories.wedding') || '결혼선물' },
    { value: 'baby', label: t('wishlist.categories.baby') || '육아용품' },
    { value: 'electronics', label: t('wishlist.categories.electronics') || '전자제품' },
    { value: 'fashion', label: t('wishlist.categories.fashion') || '패션' },
    { value: 'books', label: t('wishlist.categories.books') || '도서' },
    { value: 'travel', label: t('wishlist.categories.travel') || '여행' },
    { value: 'home', label: t('wishlist.categories.home') || '홈데코' }
  ]

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <RectangleStackIcon className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">{t('wishlist.create.basicInfo') || '기본 정보'}</h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('wishlist.create.title')} *
            </label>
            <Input
              value={formData.title}
              onChange={(value) => setFormData(prev => ({ ...prev, title: value }))}
              placeholder={t('wishlist.create.titlePlaceholder') || '예: 2024년 생일 선물'}
              className={`bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400 ${errors.title ? 'border-red-500' : ''
                }`}
              disabled={loading}
              maxLength={50}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.title && (
                <p className="text-red-400 text-sm">{errors.title}</p>
              )}
              <p className={`text-xs ml-auto ${formData.title.length > 45 ? 'text-yellow-400' : 'text-slate-500'}`}>
                {formData.title.length}/50
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('wishlist.create.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t('wishlist.create.descriptionPlaceholder') || '이 위시리스트에 대한 간단한 설명을 작성해주세요...'}
              disabled={loading}
              rows={4}
              className={`w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${errors.description ? 'border-red-500' : ''
                }`}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.description && (
                <p className="text-red-400 text-sm">{errors.description}</p>
              )}
              <p className={`text-xs ml-auto ${formData.description.length > 180 ? 'text-yellow-400' : 'text-slate-500'}`}>
                {formData.description.length}/200
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('wishlist.create.category')}
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
  )
}