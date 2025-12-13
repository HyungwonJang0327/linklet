'use client'

import { Card } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n/context'
import { useState } from 'react'
import Image from 'next/image'
import { PhotoIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/hooks/use-toast'

interface ThemeSelectorProps {
  selectedTheme: string
  onThemeChange: (theme: string) => void
  backgroundImageUrl?: string
  onBackgroundImageChange?: (url: string) => void
}

const themes = [
  {
    id: 'modern',
    nameKey: 'modern',
    descKey: 'modernDesc',
    preview: 'from-slate-900 to-blue-900',
    cardStyle: 'bg-white/10 backdrop-blur-sm'
  },
  {
    id: 'gradient',
    nameKey: 'gradient',
    descKey: 'gradientDesc',
    preview: 'from-purple-600 via-pink-600 to-blue-600',
    cardStyle: 'bg-white/20 backdrop-blur-sm'
  },
  {
    id: 'minimal',
    nameKey: 'minimal',
    descKey: 'minimalDesc',
    preview: 'from-gray-100 to-gray-200',
    cardStyle: 'bg-white border border-gray-200'
  },
  {
    id: 'neon',
    nameKey: 'neon',
    descKey: 'neonDesc',
    preview: 'from-black via-purple-900 to-black',
    cardStyle: 'bg-black/50 border border-cyan-400'
  },
  {
    id: 'nature',
    nameKey: 'nature',
    descKey: 'natureDesc',
    preview: 'from-green-800 via-emerald-700 to-teal-600',
    cardStyle: 'bg-white/10 backdrop-blur-sm'
  },
  {
    id: 'sunset',
    nameKey: 'sunset',
    descKey: 'sunsetDesc',
    preview: 'from-orange-600 via-red-500 to-pink-500',
    cardStyle: 'bg-white/20 backdrop-blur-sm'
  }
]

export function ThemeSelector({
  selectedTheme,
  onThemeChange,
  backgroundImageUrl = '',
  onBackgroundImageChange
}: ThemeSelectorProps) {
  const { t } = useI18n()
  const toast = useToast()
  const [uploading, setUploading] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 크기 체크 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('settings.customize.theme.backgroundImage.errors.fileSize'), 3000)
      return
    }

    // 빈 파일 체크
    if (file.size === 0) {
      toast.error(t('settings.customize.theme.backgroundImage.errors.emptyFile'), 3000)
      return
    }

    // 파일 타입 체크
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      toast.error(t('settings.customize.theme.backgroundImage.errors.fileType'), 3000)
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('img', file)

      const response = await fetch('/api/image', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        // API에서 반환한 에러 메시지 사용
        if (response.status === 429) {
          toast.error(t('settings.customize.theme.backgroundImage.errors.rateLimit'), 3000)
        } else if (response.status === 401) {
          toast.error(t('settings.customize.theme.backgroundImage.errors.authRequired'), 3000)
        } else {
          toast.error(data.message || t('settings.customize.theme.backgroundImage.errors.uploadFailed'), 3000)
        }
        return
      }

      if (onBackgroundImageChange && data.data) {
        onBackgroundImageChange(data.data)
        toast.success(t('settings.customize.theme.backgroundImage.success'), 2000)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error(t('settings.customize.theme.backgroundImage.errors.networkError'), 3000)
    } finally {
      setUploading(false)
      // input 초기화 (같은 파일 재선택 가능하도록)
      e.target.value = ''
    }
  }

  const handleRemoveImage = () => {
    if (onBackgroundImageChange) {
      onBackgroundImageChange('')
    }
    toast.success(t('settings.customize.theme.backgroundImage.removed'), 2000)
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">{t('settings.customize.theme.title')}</h2>
        <p className="text-slate-400 text-sm mb-6">
          {t('settings.customize.theme.description')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onThemeChange(theme.id)}
              className={`relative group p-4 rounded-lg transition-all ${
                selectedTheme === theme.id
                  ? 'ring-2 ring-blue-500 bg-blue-500/10'
                  : 'hover:bg-slate-700/30'
              }`}
            >
              {/* Theme Preview */}
              <div className={`w-full h-24 rounded-lg bg-gradient-to-br ${theme.preview} mb-3 relative overflow-hidden`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`w-16 h-4 rounded ${theme.cardStyle} opacity-80`}></div>
                </div>
                <div className="absolute bottom-2 left-2">
                  <div className={`w-8 h-8 rounded-full ${theme.cardStyle} opacity-60`}></div>
                </div>
                <div className="absolute top-2 right-2">
                  <div className={`w-3 h-3 rounded-full ${theme.cardStyle} opacity-60`}></div>
                </div>
              </div>

              <div className="text-left">
                <h3 className={`font-medium mb-1 ${
                  selectedTheme === theme.id ? 'text-blue-300' : 'text-slate-200'
                }`}>
                  {t(`settings.customize.theme.${theme.nameKey}`)}
                </h3>
                <p className="text-slate-400 text-sm">
                  {t(`settings.customize.theme.${theme.descKey}`)}
                </p>
              </div>
              
              {selectedTheme === theme.id && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Background Image Section */}
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <h3 className="text-lg font-medium text-white mb-4">
            {t('settings.customize.theme.backgroundImage.title')}
          </h3>
          <p className="text-slate-400 text-sm mb-4">
            {t('settings.customize.theme.backgroundImage.description')}
          </p>

          {backgroundImageUrl ? (
            <div className="space-y-4">
              <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-600">
                <Image
                  key={backgroundImageUrl}
                  src={backgroundImageUrl}
                  alt="Background"
                  fill
                  className="object-cover"
                  unoptimized
                  priority
                />
              </div>
              <div className="flex gap-2">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <div className={`flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg cursor-pointer transition-colors ${
                    uploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}>
                    <PhotoIcon className="w-5 h-5" />
                    {uploading ? t('settings.customize.theme.backgroundImage.uploading') : t('settings.customize.theme.backgroundImage.change')}
                  </div>
                </label>
                <button
                  onClick={handleRemoveImage}
                  disabled={uploading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <TrashIcon className="w-5 h-5" />
                  {t('settings.customize.theme.backgroundImage.remove')}
                </button>
              </div>
            </div>
          ) : (
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
              <div className={`flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-slate-500 hover:bg-slate-700/30 transition-colors ${
                uploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}>
                <PhotoIcon className="w-12 h-12 text-slate-400" />
                <div className="text-center">
                  <p className="text-slate-300 font-medium mb-1">
                    {uploading ? t('settings.customize.theme.backgroundImage.uploading') : t('settings.customize.theme.backgroundImage.upload')}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {t('settings.customize.theme.backgroundImage.uploadPrompt')} ({t('settings.customize.theme.backgroundImage.maxSize')})
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    {t('settings.customize.theme.backgroundImage.supportedFormats')}
                  </p>
                </div>
              </div>
            </label>
          )}
        </div>
      </div>
    </Card>
  )
}