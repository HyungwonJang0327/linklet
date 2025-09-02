'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/context'
import EmailNotifications from './components/email-notifications'
import PushNotifications from './components/push-notifications'

export default function NotificationsPage() {
  const { t } = useI18n()
  const [notifications, setNotifications] = useState({
    email: {
      newWishlistItems: true,
      weeklyDigest: true,
      promotions: false
    },
    push: {
      enabled: true,
      newWishlistItems: true,
      comments: true
    }
  })

  const [loading, setLoading] = useState(false)

  const handleToggle = (category: 'email' | 'push', key: string) => {
    setNotifications(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key as keyof typeof prev[typeof category]]
      }
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
  }


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t('settings.notifications.title')}</h1>
        <p className="text-slate-300">
          {t('settings.notifications.description')}
        </p>
      </div>

      {/* Email Notifications */}
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <div className="p-6">
          <EmailNotifications 
            notifications={notifications.email} 
            onToggle={(key) => handleToggle('email', key)} 
          />
        </div>
      </Card>

      {/* Push Notifications */}
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <div className="p-6">
          <PushNotifications 
            notifications={notifications.push} 
            onToggle={(key) => handleToggle('push', key)} 
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          loading={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {t('common.save')}
        </Button>
      </div>
    </div>
  )
}