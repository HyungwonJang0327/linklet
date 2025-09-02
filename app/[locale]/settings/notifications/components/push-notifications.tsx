'use client'

import { DevicePhoneMobileIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'
import ToggleSwitch from '@/components/ui/toggle-switch'

interface PushNotificationsProps {
  notifications: {
    enabled: boolean
    newWishlistItems: boolean
    comments: boolean
  }
  onToggle: (key: string) => void
}

export default function PushNotifications({ notifications, onToggle }: PushNotificationsProps) {
  const { t } = useI18n()

  return (
    <>
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
            enabled={notifications.enabled}
            onChange={() => onToggle('enabled')}
          />
        </div>

        {notifications.enabled && (
          <>
            <div className="flex items-center justify-between py-3 ml-4">
              <div>
                <div className="text-slate-200 font-medium">{t('settings.notifications.newItems')}</div>
                <div className="text-slate-400 text-sm">새 아이템 추가 시 푸시 알림</div>
              </div>
              <ToggleSwitch
                enabled={notifications.newWishlistItems}
                onChange={() => onToggle('newWishlistItems')}
              />
            </div>

            <div className="flex items-center justify-between py-3 ml-4">
              <div>
                <div className="text-slate-200 font-medium">{t('settings.notifications.comments')}</div>
                <div className="text-slate-400 text-sm">위시리스트에 댓글이 달리면 알림</div>
              </div>
              <ToggleSwitch
                enabled={notifications.comments}
                onChange={() => onToggle('comments')}
              />
            </div>
          </>
        )}
      </div>
    </>
  )
}