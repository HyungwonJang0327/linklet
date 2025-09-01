'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { useI18n } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { User, LogOut } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const { t, locale } = useI18n()

  return (
    <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={`/${locale}`} className="text-2xl font-bold text-blue-400 hover:text-blue-300 transition-colors">
          Linklet
        </Link>
        
        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {user.profileImage ? (
                  <Image 
                    src={user.profileImage} 
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                    width={32}
                    height={32}
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                <span className="text-sm font-medium text-white">{user.name}</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Link href={`/${locale}/login`}>
              <Button variant="outline" className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white">
                {t('login.title') || '로그인'}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}