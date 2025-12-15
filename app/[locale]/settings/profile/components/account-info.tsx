'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { formatDate } from '@/lib/utils'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { useUpdateUser } from '@/hooks/use-user'
import { toast } from 'sonner'

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
  const router = useRouter()
  const pathname = usePathname()
  const { locale = 'kr' } = useParams() as { locale: 'kr' | 'en' | 'jp' }
  const updateUserMutation = useUpdateUser()
  const [isChangingLanguage, setIsChangingLanguage] = useState(false)

  const handleLanguageChange = async (newLocale: string) => {
    if (!userData || newLocale === userData.locale) return

    setIsChangingLanguage(true)
    try {
      // Update DB
      await updateUserMutation.mutateAsync({ locale: newLocale })

      // Navigate to new locale URL
      const newPath = pathname.replace(`/${locale}`, `/${newLocale}`)
      router.push(newPath)
    } catch (error) {
      console.error('Failed to change language:', error)
      toast.error(t('settings.profile.updateFailed'))
      setIsChangingLanguage(false)
    }
  }

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
          <div>
            <select
              value={userData.locale || 'kr'}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={isChangingLanguage}
              className="px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="kr">한국어</option>
              <option value="en">English</option>
              <option value="jp">日本語</option>
            </select>
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