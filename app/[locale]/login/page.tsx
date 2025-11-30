'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  const { t, locale } = useI18n()
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      await signIn('google', { 
        callbackUrl: `/${locale}/settings/wishlists`,
        redirect: true 
      })
    } catch (error) {
      console.error('Google login failed:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 뒤로가기 버튼 */}
        <div className="mb-6">
          <Link href={`/${locale}`}>
            <Button variant="ghost" className="flex items-center gap-2 text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
              {t('login.backToHome')}
            </Button>
          </Link>
        </div>

        <Card className="p-8 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-white">Linklet</h1>
            <p className="text-slate-300">
              {t('login.subtitle')}
            </p>
          </div>

          <div className="space-y-4">
            {/* Google 로그인 버튼 */}
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 text-base border border-gray-300"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isLoading ? t('login.signingIn') : t('login.GoogleLogin')}
            </Button>

            {/* 구분선 */}
            {/* <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-800 text-slate-400">{t('login.or')}</span>
              </div>
            </div> */}

          </div>

          {/* 기능 차이 안내 */}
          <div className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
            <h3 className="font-medium mb-3 text-sm text-white">{t('login.loginFeatures.title')}</h3>
            <ul className="text-xs text-slate-300 space-y-1">
              <li>• {t('login.loginFeatures.shareUrl')}</li>
              {/* <li>• {t('login.loginFeatures.permanentStorage')}</li> */}
              <li>• {t('login.loginFeatures.syncDevices')}</li>
              <li>• {t('login.loginFeatures.management')}</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}