'use client'

import { usePathname, useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  HomeIcon,
  UsersIcon,
  GiftIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  Cog6ToothIcon,
  MegaphoneIcon
} from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { locale = 'kr' } = useParams()
  const { user, isLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [stats, setStats] = useState({ totalUsers: 0, totalWishlists: 0, pendingErrors: 0, pendingFeedback: 0 })

  // Check admin access
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not logged in
        router.push(`/${locale}/login`)
      } else if (!user.isAdmin) {
        // Not an admin
        router.push(`/${locale}/settings`)
      } else {
        // Admin access granted
        setIsChecking(false)
        fetchStats()
      }
    }
  }, [user, isLoading, router, locale])

  // Fetch admin stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    }
  }

  // Show loading state while checking
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">권한 확인 중...</p>
        </div>
      </div>
    )
  }

  const navigation: NavItem[] = [
    { name: '대시보드', href: `/${locale}/admin`, icon: HomeIcon },
    { name: '사용자 관리', href: `/${locale}/admin/users`, icon: UsersIcon },
    { name: '위시리스트 관리', href: `/${locale}/admin/wishlists`, icon: GiftIcon },
    { name: '공지사항 관리', href: `/${locale}/admin/notices`, icon: MegaphoneIcon },
    { name: '통계 분석', href: `/${locale}/admin/analytics`, icon: ChartBarIcon },
    { name: '시스템 설정', href: `/${locale}/admin/settings`, icon: Cog6ToothIcon },
    { name: '컨텐츠 관리', href: `/${locale}/admin/content`, icon: GiftIcon },
    { name: '에러 로그', href: `/${locale}/admin/errors`, icon: ExclamationTriangleIcon, badge: stats.pendingErrors > 0 ? stats.pendingErrors : undefined },
    { name: '문의 및 피드백', href: `/${locale}/admin/inquiries`, icon: ChatBubbleLeftRightIcon, badge: stats.pendingFeedback > 0 ? stats.pendingFeedback : undefined },
  ]

  const isActive = (href: string) => {
    if (href === `/${locale}/admin`) {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-800/95 backdrop-blur-sm border-r border-slate-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo and close button */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-white font-semibold text-lg">Admin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Admin info */}
        <div className="px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || 'Admin'}
              </p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium flex-1">{item.name}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={() => router.push(`/${locale}/settings`)}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-lg transition-all"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            <span className="text-sm font-medium">메인으로 돌아가기</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700 flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-300 hover:text-white"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>

          <div className="flex-1 lg:flex-none">
            <h1 className="text-xl font-semibold text-white">
              {navigation.find(item => isActive(item.href))?.name || '대시보드'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick stats or notifications can go here */}
            <div className="hidden md:flex items-center gap-6 text-sm">
              <div className="text-slate-400">
                총 사용자: <span className="text-white font-semibold">{stats.totalUsers.toLocaleString()}</span>
              </div>
              <div className="text-slate-400">
                위시리스트: <span className="text-white font-semibold">{stats.totalWishlists.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
