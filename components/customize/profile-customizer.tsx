'use client'

import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { UserCircleIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'

interface ProfileCustomizerProps {
  profile: {
    displayName: string
    bio: string
    avatar: string
    showItemCount: boolean
    showCreatedDate: boolean
  }
  onProfileChange: (profile: any) => void
}

export function ProfileCustomizer({ profile, onProfileChange }: ProfileCustomizerProps) {
  const { t } = useI18n()

  const updateProfile = (updates: Partial<typeof profile>) => {
    onProfileChange({ ...profile, ...updates })
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">{t('settings.customize.profile.title')}</h2>
        <p className="text-slate-400 text-sm mb-6">
          {t('settings.customize.profile.description')}
        </p>

        {/* Avatar Section */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-white mb-4">{t('settings.customize.profile.avatarTitle')}</h3>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center overflow-hidden relative">
              {profile.avatar ? (
                <Image
                  src={profile.avatar}
                  alt="Profile"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <UserCircleIcon className="w-12 h-12 text-slate-400" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex gap-2 mb-2">
                <Button variant="outline" size="sm" className="text-slate-300 border-slate-600">
                  <PhotoIcon className="w-4 h-4 mr-2" />
                  {t('settings.customize.profile.uploadImage')}
                </Button>
                {profile.avatar && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateProfile({ avatar: '' })}
                    className="text-red-400 hover:text-red-300"
                  >
                    {t('settings.customize.profile.remove')}
                  </Button>
                )}
              </div>
              <p className="text-slate-400 text-sm">
                {t('settings.customize.profile.fileFormat')}
              </p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-4 mb-6">
          <Input
            label={t('settings.customize.profile.displayName')}
            value={profile.displayName}
            onChange={(value: string) => updateProfile({ displayName: value })}
            placeholder={t('settings.customize.profile.displayNamePlaceholder')}
            className="bg-slate-900/50 border-slate-600 text-white"
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('settings.customize.profile.bio')}
            </label>
            <textarea
              value={profile.bio}
              onChange={(e) => updateProfile({ bio: e.target.value })}
              placeholder={t('settings.customize.profile.bioPlaceholder')}
              rows={3}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              maxLength={200}
            />
            <div className="text-right text-slate-400 text-xs mt-1">
              {profile.bio.length}/200
            </div>
          </div>
        </div>

        {/* Display Options */}
        <div className="pt-6 border-t border-slate-700/50">
          <h3 className="text-lg font-medium text-white mb-4">{t('settings.customize.profile.displayOptions')}</h3>

          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={profile.showItemCount}
                onChange={(e) => updateProfile({ showItemCount: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-slate-900/50 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div>
                <div className="text-slate-200 font-medium">{t('settings.customize.profile.showItemCount')}</div>
                <div className="text-slate-400 text-sm">{t('settings.customize.profile.showItemCountDesc')}</div>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={profile.showCreatedDate}
                onChange={(e) => updateProfile({ showCreatedDate: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-slate-900/50 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div>
                <div className="text-slate-200 font-medium">{t('settings.customize.profile.showCreatedDate')}</div>
                <div className="text-slate-400 text-sm">{t('settings.customize.profile.showCreatedDateDesc')}</div>
              </div>
            </label>
          </div>
        </div>

        {/* Badge Section */}
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <h3 className="text-lg font-medium text-white mb-4">{t('settings.customize.profile.badgeSettings')}</h3>
          <p className="text-slate-400 text-sm mb-4">
            {t('settings.customize.profile.badgeSettingsDesc')}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { id: 'verified', nameKey: 'settings.customize.profile.verified', color: 'bg-blue-500', icon: '✓' },
              { id: 'premium', nameKey: 'settings.customize.profile.premium', color: 'bg-yellow-500', icon: '⭐' },
              { id: 'creator', nameKey: 'settings.customize.profile.creator', color: 'bg-purple-500', icon: '🎨' },
              { id: 'trendy', nameKey: 'settings.customize.profile.trendy', color: 'bg-pink-500', icon: '🔥' },
              { id: 'eco', nameKey: 'settings.customize.profile.eco', color: 'bg-green-500', icon: '🌱' },
              { id: 'budget', nameKey: 'settings.customize.profile.budget', color: 'bg-orange-500', icon: '💰' }
            ].map((badge) => (
              <button
                key={badge.id}
                className="p-3 rounded-lg border border-slate-600 hover:border-slate-500 transition-all group text-left"
              >
                <div className={`w-8 h-8 ${badge.color} rounded-lg flex items-center justify-center text-white text-sm mb-2`}>
                  {badge.icon}
                </div>
                <div className="text-slate-200 text-sm font-medium group-hover:text-white">
                  {t(badge.nameKey)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}