'use client'

import { useState } from 'react'
import { SettingsSidebar } from '@/components/settings/settings-sidebar'
import { MobileSettingsHeader } from '@/components/settings/mobile-settings-header'
import { AuthGuard } from '@/components/auth/auth-guard'
import { useI18n } from '@/lib/i18n/context'

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { t } = useI18n()

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden">
        <MobileSettingsHeader 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      </div>

      <div className="flex h-full lg:h-screen">
        {/* Desktop Sidebar - Fixed */}
        <div className="hidden lg:block lg:fixed lg:inset-y-0 lg:left-0 lg:z-50">
          <SettingsSidebar 
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="lg:hidden">
            <div 
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-72">
              <SettingsSidebar onItemClick={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content - Scrollable */}
        <div className={`flex-1 transition-all duration-200 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
        }`}>
          <main className="h-full overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
            <AuthGuard 
              title={t('auth.settingsAccess.title')}
              description={t('auth.settingsAccess.description')}
            >
              {children}
            </AuthGuard>
          </main>
        </div>
      </div>
    </div>
  )
}