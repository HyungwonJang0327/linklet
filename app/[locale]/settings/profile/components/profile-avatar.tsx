'use client'

import { UserIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'
import { generateUserInitials } from '@/lib/validations/user'
import Image from 'next/image'

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

interface ProfileAvatarProps {
  userData: UserData | null | undefined
}

export default function ProfileAvatar({ userData }: ProfileAvatarProps) {
  const { t } = useI18n()

  if (!userData) {
    return (
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center">
          <UserIcon className="w-10 h-10 text-slate-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">{t('settings.profile.avatar')}</h2>
          <p className="text-slate-400 text-sm">{t('settings.profile.noUserData')}</p>
        </div>
      </div>
    )
  }

  const userInitials = generateUserInitials(userData.name)

  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden">
        {userData.image ? (
          <Image
            src={userData.image}
            alt={userData.name || 'Profile'}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling?.classList.remove('hidden')
            }}
            width={80}
            height={80}
          />
        ) : null}
        <div className={`w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ${userData.image ? 'hidden' : ''}`}>
          {userInitials !== '?' ? (
            <span className="text-white text-xl font-semibold">{userInitials}</span>
          ) : (
            <UserIcon className="w-10 h-10 text-white" />
          )}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-white">{userData.name || 'Anonymous User'}</h2>
        <p className="text-slate-400 text-sm">
          {userData.bio || 'No bio available'}
        </p>
      </div>
    </div>
  )
}