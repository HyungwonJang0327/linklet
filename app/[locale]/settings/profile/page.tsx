'use client'

// import { useState } from 'react' // Currently not used
import { Card } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n/context'
import { useAuth } from '@/components/providers/auth-provider'
import { useUser } from '@/hooks/use-user'
import ProfileAvatar from './components/profile-avatar'
import ProfileForm from './components/profile-form'
import AccountInfo from './components/account-info'
// import DataImport from './components/data-import' // Commented out temporarily

export default function ProfilePage() {
  const { t } = useI18n()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { data: userData, isLoading, error, refetch } = useUser()

  // Handle user data update (will be handled by TanStack Query automatically)
  const handleUserUpdate = () => {
    // Refetch data to ensure we have the latest
    refetch()
  }

  if (!isAuthenticated && !authLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold text-white mb-2">{t('settings.profile.authRequired')}</h2>
            <p className="text-slate-300">{t('settings.profile.authRequiredDesc')}</p>
          </div>
        </Card>
      </div>
    )
  }

  if (authLoading || isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <div className="p-8 text-center">
            <div className="text-slate-300">{t('common.loading')}</div>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold text-red-400 mb-2">{t('common.error')}</h2>
            <p className="text-slate-300">{error instanceof Error ? error.message : t('settings.profile.failedToLoad')}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {t('settings.profile.retry')}
            </button>
          </div>
        </Card>
      </div>
    )
  }

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
          <ProfileAvatar userData={userData} />
          <ProfileForm userData={userData} onUserUpdate={handleUserUpdate} />
        </div>
      </Card>

      {/* Account Info */}
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <div className="p-6">
          <AccountInfo userData={userData} />
        </div>
      </Card>
    </div>
  )
}