'use client'

import { useI18n } from '@/lib/i18n/context'

export default function AccountInfo() {
  const { t } = useI18n()

  return (
    <>
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
    </>
  )
}