'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n/context'
import { Shield, LogIn, Home } from 'lucide-react'
import Link from 'next/link'

interface UnauthorizedProps {
  title?: string
  description?: string
  showLoginButton?: boolean
  showHomeButton?: boolean
}

export function Unauthorized({
  title,
  description,
  showLoginButton = true,
  showHomeButton = true
}: UnauthorizedProps) {
  const { t, locale } = useI18n()

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm max-w-md w-full text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <CardTitle className="text-white text-xl">
            {title || t('auth.unauthorized.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-slate-400 text-sm leading-relaxed">
            {description || t('auth.unauthorized.description')}
          </p>

          <div className="flex flex-col gap-3">
            {showLoginButton && (
              <Link href={`/${locale}/login`}>
                <Button variant="primary" size="md" className="w-full">
                  <LogIn className="w-4 h-4 mr-2" />
                  {t('auth.unauthorized.signInButton')}
                </Button>
              </Link>
            )}

            {showHomeButton && (
              <Link href={`/${locale}`}>
                <Button variant="outline" size="md" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700">
                  <Home className="w-4 h-4 mr-2" />
                  {t('auth.unauthorized.homeButton')}
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}