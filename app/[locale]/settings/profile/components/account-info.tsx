'use client'

import { useI18n } from '@/lib/i18n/context'
import { formatDate } from '@/lib/utils'
import { useParams } from 'next/navigation'

interface UserData {
  id: string
  name?: string
  email?: string
  bio?: string
  image?: string
  locale?: string
  createdAt: string
  _count?: {
    wishlists: number
  }
}

interface AccountInfoProps {
  userData: UserData | null | undefined
}

export default function AccountInfo({ userData }: AccountInfoProps) {
  const { t } = useI18n()
  const { locale = 'kr' } = useParams() as { locale: string }

  if (!userData) {
    return (
      <>
        <h2 className="text-xl font-semibold text-white mb-4">{t('settings.profile.accountInfo')}</h2>
        <div className="text-center text-slate-400 py-8">
          {t('settings.profile.noUserData')}
        </div>
      </>
    )
  }
  return (
    <>
      <h2 className="text-xl font-semibold text-white mb-4">{t('settings.profile.accountInfo')}</h2>

      <div className="space-y-4">

        <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
          <div>
            <div className="text-slate-300 font-medium">{t('settings.profile.joinDate')}</div>
            <div className="text-slate-400 text-sm">{t('settings.profile.joinDate-description')}</div>
          </div>
          <div className="text-slate-300">
            {formatDate(userData.createdAt, locale)}
          </div>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
          <div>
            <div className="text-slate-300 font-medium">{t('settings.profile.Email')}</div>
            <div className="text-slate-400 text-sm">{t('settings.profile.Email-description')}</div>
          </div>
          <div className="text-slate-300 truncate max-w-xs">
            {userData.email || 'Not set'}
          </div>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
          <div>
            <div className="text-slate-300 font-medium">{t('settings.profile.language')}</div>
            <div className="text-slate-400 text-sm">{t('settings.profile.preferredLanguage')}</div>
          </div>
          <div className="text-slate-300">
            {userData.locale === 'kr' ? '한국어' :
              userData.locale === 'en' ? 'English' :
                userData.locale === 'jp' ? '日本語' :
                  userData.locale || 'Not set'}
          </div>
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <div className="text-slate-300 font-medium">{t('settings.profile.wishlistCount')}</div>
            <div className="text-slate-400 text-sm">{t('settings.profile.wishlistCount-description')}</div>
          </div>
          <div className="text-slate-300">
            {userData._count?.wishlists || 0}
          </div>
        </div>
      </div>
    </>
  )
}