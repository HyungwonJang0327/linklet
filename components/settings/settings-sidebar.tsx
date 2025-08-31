'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { 
  UserIcon, 
  BellIcon, 
  PaintBrushIcon,
  KeyIcon,
  TrashIcon,
  SwatchIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

interface SettingsSidebarProps {
  onItemClick?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function SettingsSidebar({ onItemClick, collapsed = false, onToggleCollapse }: SettingsSidebarProps) {
  const pathname = usePathname()
  const { t, locale } = useI18n()

  const navigationItems = [
    {
      nameKey: 'settings.profile.title',
      href: `/${locale}/settings`,
      icon: UserIcon,
      descriptionKey: 'settings.profile.description'
    },
    {
      nameKey: 'settings.notifications.title',
      href: `/${locale}/settings/notifications`,
      icon: BellIcon,
      descriptionKey: 'settings.notifications.description'
    },
    {
      nameKey: 'settings.customize.title',
      href: `/${locale}/settings/customize`,
      icon: SwatchIcon,
      descriptionKey: 'settings.customize.description'
    },
    // {
    //   nameKey: 'settings.privacy',
    //   href: `/${locale}/settings/privacy`,
    //   icon: ShieldCheckIcon,
    //   descriptionKey: 'Privacy and security settings'
    // },
    {
      nameKey: 'settings.appearance.title',
      href: `/${locale}/settings/appearance`,
      icon: PaintBrushIcon,
      descriptionKey: 'settings.appearance.description'
    },
    // {
    //   nameKey: 'settings.apiKeys',
    //   href: `/${locale}/settings/api`,
    //   icon: KeyIcon,
    //   descriptionKey: 'API key management'
    // },
    // {
    //   nameKey: 'settings.dangerZone',
    //   href: `/${locale}/settings/danger`,
    //   icon: TrashIcon,
    //   descriptionKey: 'Account deletion and dangerous actions'
    // }
  ]

  return (
    <div className={`${collapsed ? 'w-20' : 'w-72'} bg-slate-800/50 backdrop-blur-sm border-r border-slate-700/50 min-h-screen transition-all duration-300 relative`}>
      {/* Collapse Toggle Button */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-6 w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded-full border border-slate-600 flex items-center justify-center transition-colors z-10"
        >
          {collapsed ? (
            <ChevronRightIcon className="w-4 h-4 text-slate-300" />
          ) : (
            <ChevronLeftIcon className="w-4 h-4 text-slate-300" />
          )}
        </button>
      )}
      
      <div className={`${collapsed ? 'p-3' : 'p-6'} transition-all duration-300`}>
        {!collapsed && (
          <h2 className="text-xl font-semibold text-white mb-6">{t('settings.title')}</h2>
        )}
        
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.nameKey}
                href={item.href}
                onClick={onItemClick}
                className={`
                  flex items-start gap-3 p-3 rounded-lg transition-colors duration-200 relative group
                  ${isActive 
                    ? 'bg-blue-600/20 border border-blue-500/30 text-blue-300' 
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? t(item.nameKey) : undefined}
              >
                <item.icon className={`w-5 h-5 ${collapsed ? '' : 'mt-0.5'} flex-shrink-0 ${
                  isActive ? 'text-blue-400' : 'text-slate-400'
                }`} />
                
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${
                      isActive ? 'text-blue-300' : 'text-slate-200'
                    }`}>
                      {t(item.nameKey)}
                    </div>
                    <div className={`text-sm mt-0.5 ${
                      isActive ? 'text-blue-400/80' : 'text-slate-400'
                    }`}>
                      {t(item.descriptionKey) || item.descriptionKey}
                    </div>
                  </div>
                )}

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-sm text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-slate-600">
                    {t(item.nameKey)}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}