'use client'

import { EnvelopeIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'
import ToggleSwitch from '@/components/ui/toggle-switch'

interface EmailNotificationsProps {
  notifications: {
    newWishlistItems: boolean
    weeklyDigest: boolean
    promotions: boolean
  }
  onToggle: (key: string) => void
}

export default function EmailNotifications({ notifications, onToggle }: EmailNotificationsProps) {
  const { t } = useI18n()

  return (
    <>
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
            enabled={notifications.newWishlistItems}
            onChange={() => onToggle('newWishlistItems')}
          />
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <div className="text-slate-200 font-medium">{t('settings.notifications.weeklyDigest')}</div>
            <div className="text-slate-400 text-sm">주간 위시리스트 활동 요약 메일</div>
          </div>
          <ToggleSwitch
            enabled={notifications.weeklyDigest}
            onChange={() => onToggle('weeklyDigest')}
          />
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <div className="text-slate-200 font-medium">{t('settings.notifications.promotions')}</div>
            <div className="text-slate-400 text-sm">특별 혜택 및 할인 정보 메일</div>
          </div>
          <ToggleSwitch
            enabled={notifications.promotions}
            onChange={() => onToggle('promotions')}
          />
        </div>
      </div>
    </>
  )
}