'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BellIcon, EnvelopeIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'

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

  const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean, onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-600' : 'bg-slate-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )

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
          <div className="flex items-center gap-3 mb-6">
            <EnvelopeIcon className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">{t('settings.notifications.email')}</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <div className="text-slate-200 font-medium">{t('settings.notifications.newItems')}</div>
                <div className="text-slate-400 text-sm">위시리스트에 새 아이템이 추가되면 알림</div>
              </div>
              <ToggleSwitch
                enabled={notifications.email.newWishlistItems}
                onChange={() => handleToggle('email', 'newWishlistItems')}
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <div className="text-slate-200 font-medium">{t('settings.notifications.weeklyDigest')}</div>
                <div className="text-slate-400 text-sm">주간 위시리스트 활동 요약 메일</div>
              </div>
              <ToggleSwitch
                enabled={notifications.email.weeklyDigest}
                onChange={() => handleToggle('email', 'weeklyDigest')}
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <div className="text-slate-200 font-medium">{t('settings.notifications.promotions')}</div>
                <div className="text-slate-400 text-sm">특별 혜택 및 할인 정보 메일</div>
              </div>
              <ToggleSwitch
                enabled={notifications.email.promotions}
                onChange={() => handleToggle('email', 'promotions')}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Push Notifications */}
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <DevicePhoneMobileIcon className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-semibold text-white">{t('settings.notifications.push')}</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <div className="text-slate-200 font-medium">푸시 알림 사용</div>
                <div className="text-slate-400 text-sm">브라우저 푸시 알림을 활성화합니다</div>
              </div>
              <ToggleSwitch
                enabled={notifications.push.enabled}
                onChange={() => handleToggle('push', 'enabled')}
              />
            </div>

            {notifications.push.enabled && (
              <>
                <div className="flex items-center justify-between py-3 ml-4">
                  <div>
                    <div className="text-slate-200 font-medium">{t('settings.notifications.newItems')}</div>
                    <div className="text-slate-400 text-sm">새 아이템 추가 시 푸시 알림</div>
                  </div>
                  <ToggleSwitch
                    enabled={notifications.push.newWishlistItems}
                    onChange={() => handleToggle('push', 'newWishlistItems')}
                  />
                </div>

                <div className="flex items-center justify-between py-3 ml-4">
                  <div>
                    <div className="text-slate-200 font-medium">{t('settings.notifications.comments')}</div>
                    <div className="text-slate-400 text-sm">위시리스트에 댓글이 달리면 알림</div>
                  </div>
                  <ToggleSwitch
                    enabled={notifications.push.comments}
                    onChange={() => handleToggle('push', 'comments')}
                  />
                </div>
              </>
            )}
          </div>
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