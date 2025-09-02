'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MessageSquare, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'

interface LoginPageProps {
  params: Promise<{ locale: string }>
}

export default function LoginPage({ params }: LoginPageProps) {
  const { t, locale } = useI18n()
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    // TODO: 카카오 로그인 연동 구현
    console.log('카카오 로그인 시작')

    // 임시로 로딩 상태만 표시
    setTimeout(() => {
      setIsLoading(false)
      alert('카카오 로그인 연동이 필요합니다')
    }, 1000)
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
            {/* 카카오 로그인 버튼 */}
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 text-base"
            >
              <MessageSquare className="w-5 h-5 mr-3" />
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
              <li>• {t('login.loginFeatures.permanentStorage')}</li>
              <li>• {t('login.loginFeatures.syncDevices')}</li>
              <li>• {t('login.loginFeatures.management')}</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}