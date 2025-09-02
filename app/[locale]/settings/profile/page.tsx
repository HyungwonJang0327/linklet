'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n/context'
import ProfileAvatar from './components/profile-avatar'
import ProfileForm from './components/profile-form'
import AccountInfo from './components/account-info'

export default function ProfilePage() {
  const { t } = useI18n()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: ''
  })

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
          <ProfileAvatar />
          <ProfileForm formData={formData} setFormData={setFormData} />
        </div>
      </Card>

      {/* Account Info */}
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <div className="p-6">
          <AccountInfo />
        </div>
      </Card>
    </div>
  )
}