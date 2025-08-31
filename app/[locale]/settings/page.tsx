'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { UserIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'

export default function SettingsPage() {
  const { t } = useI18n()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // TODO: API 호출로 프로필 업데이트
    await new Promise(resolve => setTimeout(resolve, 1000)) // 임시 딜레이
    
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t('settings.profile.title')}</h1>
        <p className="text-slate-300">
          {t('settings.profile.description')}
        </p>
      </div>

      {/* Profile Section */}
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <UserIcon className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{t('settings.profile.avatar')}</h2>
              <p className="text-slate-400 text-sm">JPG, PNG 파일을 업로드하세요</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 text-slate-300 border-slate-600 hover:bg-slate-700/50"
              >
                {t('settings.profile.uploadPhoto')}
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label={t('settings.profile.displayName')}
                value={formData.name}
                onChange={(value: string) => setFormData(prev => ({ ...prev, name: value }))}
                placeholder="홍길동"
                disabled={loading}
                className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400"
              />

              <Input
                label={t('settings.profile.email')}
                type="email"
                value={formData.email}
                onChange={(value: string) => setFormData(prev => ({ ...prev, email: value }))}
                placeholder="example@email.com"
                disabled={loading}
                className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('settings.profile.bio')}
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="자신을 간단히 소개해주세요..."
                disabled={loading}
                rows={4}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                loading={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {t('common.save')}
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {/* Account Info */}
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">{t('settings.profile.accountInfo')}</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
              <div>
                <div className="text-slate-300 font-medium">{t('settings.profile.userId')}</div>
                <div className="text-slate-400 text-sm">{t('settings.profile.userId-description')}</div>
              </div>
              <div className="text-slate-300 font-mono text-sm bg-slate-900/50 px-3 py-1 rounded">
                user_1234567890
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
              <div>
                <div className="text-slate-300 font-medium">{t('settings.profile.joinDate')}</div>
                <div className="text-slate-400 text-sm">{t('settings.profile.joinDate-description')}</div>
              </div>
              <div className="text-slate-300">2024년 8월 30일</div>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <div className="text-slate-300 font-medium">{t('settings.profile.wishlistCount')}</div>
                <div className="text-slate-400 text-sm">{t('settings.profile.wishlistCount-description')}</div>
              </div>
              <div className="text-slate-300">3개</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}