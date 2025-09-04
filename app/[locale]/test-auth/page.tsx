'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/providers/auth-provider'
import { AuthGuard } from '@/components/auth/auth-guard'
import { User, Settings, Lock } from 'lucide-react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'

export default function TestAuthPage() {
  const { user, isAuthenticated, logout } = useAuth()
  const { t } = useI18n()

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{t('auth.testPage.title')}</h1>
        <p className="text-slate-400">
          {t('auth.testPage.subtitle')}
        </p>
      </div>

      <div className="grid gap-6">
        {/* Current Auth Status */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              {t('auth.testPage.currentStatus')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">{t('auth.testPage.loginStatus')}</span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  isAuthenticated 
                    ? 'bg-green-600/20 text-green-400 border border-green-500/30' 
                    : 'bg-red-600/20 text-red-400 border border-red-500/30'
                }`}>
                  {isAuthenticated ? t('auth.testPage.loggedIn') : t('auth.testPage.notLoggedIn')}
                </span>
              </div>
              
              {isAuthenticated && user && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">{t('auth.testPage.username')}</span>
                    <span className="text-white">{user.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">{t('auth.testPage.email')}</span>
                    <span className="text-white">{user.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">{t('auth.testPage.userId')}</span>
                    <span className="text-white font-mono text-sm">{user.id}</span>
                  </div>
                </>
              )}
              
              {isAuthenticated && (
                <Button onClick={logout} variant="outline" className="w-full">
                  {t('auth.testPage.logoutButton')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Protected Content Test */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Lock className="w-5 h-5" />
              {t('auth.testPage.protectedContentTest')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400 mb-4">
              {t('auth.testPage.protectedContentDesc')}
            </p>
            
            <AuthGuard 
              title={t('auth.testPage.contentRequiresLogin')}
              description={t('auth.testPage.pleaseLogin')}
            >
              <div className="p-4 bg-green-600/10 border border-green-500/30 rounded-lg">
                <h3 className="text-green-400 font-medium mb-2">{t('auth.testPage.protectedContentTitle')}</h3>
                <p className="text-green-300 text-sm">
                  {t('auth.testPage.congratulations')}
                </p>
                <div className="mt-3">
                  <p className="text-green-200 text-xs">
                    • {t('auth.testPage.availableFeatures.wishlistManagement')}
                  </p>
                  <p className="text-green-200 text-xs">
                    • {t('auth.testPage.availableFeatures.personalSettings')}
                  </p>
                  <p className="text-green-200 text-xs">
                    • {t('auth.testPage.availableFeatures.personalizedExperience')}
                  </p>
                </div>
              </div>
            </AuthGuard>
          </CardContent>
        </Card>

        {/* Settings Link Test */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {t('auth.testPage.settingsPageTest')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-slate-400">
                {t('auth.testPage.authRequiredPages')}
              </p>
              
              <div className="space-y-2">
                <Link 
                  href="/kr/settings" 
                  className="block p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <div className="text-white font-medium">{t('auth.testPage.settingsHome')}</div>
                  <div className="text-slate-400 text-sm">{t('auth.testPage.settingsHomeDesc')}</div>
                </Link>
                
                <Link 
                  href="/kr/settings/profile" 
                  className="block p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <div className="text-white font-medium">{t('auth.testPage.profileSettings')}</div>
                  <div className="text-slate-400 text-sm">{t('auth.testPage.profileSettingsDesc')}</div>
                </Link>
                
                <Link 
                  href="/kr/settings/wishlists" 
                  className="block p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <div className="text-white font-medium">{t('auth.testPage.wishlistManagement')}</div>
                  <div className="text-slate-400 text-sm">{t('auth.testPage.wishlistManagementDesc')}</div>
                </Link>
              </div>
              
              <p className="text-slate-400 text-xs">
                {t('auth.testPage.unauthorizedNote')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}