'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/context'

interface ProfileFormProps {
  formData: {
    name: string
    email: string
    bio: string
  }
  setFormData: React.Dispatch<React.SetStateAction<{
    name: string
    email: string
    bio: string
  }>>
}

export default function ProfileForm({ formData, setFormData }: ProfileFormProps) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // TODO: API 호출로 프로필 업데이트
    await new Promise(resolve => setTimeout(resolve, 1000)) // 임시 딜레이
    
    setLoading(false)
  }

  return (
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
  )
}