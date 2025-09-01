'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { useAuth } from '@/components/providers/auth-provider'
import { 
  UserIcon, 
  BellIcon, 
  PaintBrushIcon,
  SwatchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ListBulletIcon,
  RectangleStackIcon
} from '@heroicons/react/24/outline'
import { LogOut } from 'lucide-react'

interface SettingsSidebarProps {
  onItemClick?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function SettingsSidebar({ onItemClick, collapsed = false, onToggleCollapse }: SettingsSidebarProps) {
  const pathname = usePathname()
  const { t, locale } = useI18n()
  const { logout } = useAuth()
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    wishlists: true
  })

  const navigationItems = [
    {
      nameKey: 'settings.wishlists.title',
      icon: RectangleStackIcon,
      descriptionKey: 'settings.wishlists.description',
      expandable: true,
      menuId: 'wishlists',
      submenu: [
        {
          nameKey: 'settings.wishlists.manage',
          href: `/${locale}/settings/wishlists`,
          icon: ListBulletIcon,
          descriptionKey: 'settings.wishlists.manageDesc'
        },
        {
          nameKey: 'settings.customize.title',
          href: `/${locale}/settings/customize`,
          icon: SwatchIcon,
          descriptionKey: 'settings.wishlists.customizeDesc'
        }
      ]
    },
    {
      nameKey: 'settings.appearance.title',
      href: `/${locale}/settings/appearance`,
      icon: PaintBrushIcon,
      descriptionKey: 'settings.appearance.description'
    },
    {
      nameKey: 'settings.notifications.title',
      href: `/${locale}/settings/notifications`,
      icon: BellIcon,
      descriptionKey: 'settings.notifications.description'
    },
    {
      nameKey: 'settings.profile.title',
      href: `/${locale}/settings/profile`,
      icon: UserIcon,
      descriptionKey: 'settings.profile.description'
    },
  ]

  const toggleMenu = (menuId: string) => {
    if (collapsed) return
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }))
  }

  const isMenuActive = (item: any) => {
    if (item.href) {
      return pathname === item.href
    }
    if (item.submenu) {
      return item.submenu.some((subItem: any) => pathname === subItem.href)
    }
    return false
  }

  return (
    <div className={`${collapsed ? 'w-20' : 'w-72'} bg-slate-800/50 backdrop-blur-sm border-r border-slate-700/50 min-h-screen transition-all duration-300 relative flex flex-col`}>
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
      
      <div className={`${collapsed ? 'p-3' : 'p-6'} transition-all duration-300 flex-1`}>
        {!collapsed && (
          <h2 className="text-xl font-semibold text-white mb-6">{t('settings.title')}</h2>
        )}
        
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            if (item.expandable) {
              // Expandable Menu Item
              const isExpanded = expandedMenus[item.menuId!]
              const isActive = isMenuActive(item)
              
              return (
                <div key={item.nameKey}>
                  {/* Main Menu Item */}
                  <button
                    onClick={() => toggleMenu(item.menuId!)}
                    className={`
                      w-full flex items-start gap-3 p-3 rounded-lg transition-colors duration-200 relative group
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
                      <>
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
                        <div className="flex-shrink-0 mt-0.5">
                          {isExpanded ? (
                            <ChevronUpIcon className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDownIcon className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </>
                    )}

                    {/* Tooltip for collapsed state */}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-sm text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-slate-600">
                        {t(item.nameKey)}
                      </div>
                    )}
                  </button>

                  {/* Submenu Items */}
                  {(!collapsed && isExpanded && item.submenu) && (
                    <div className="ml-6 mt-2 space-y-1">
                      {item.submenu.map((subItem: any) => {
                        const isSubActive = pathname === subItem.href
                        
                        return (
                          <Link
                            key={subItem.nameKey}
                            href={subItem.href}
                            onClick={onItemClick}
                            className={`
                              flex items-start gap-3 p-2 rounded-lg transition-colors duration-200
                              ${isSubActive 
                                ? 'bg-blue-600/20 border border-blue-500/30 text-blue-300' 
                                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                              }
                            `}
                          >
                            <subItem.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                              isSubActive ? 'text-blue-400' : 'text-slate-400'
                            }`} />
                            
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium text-sm ${
                                isSubActive ? 'text-blue-300' : 'text-slate-200'
                              }`}>
                                {t(subItem.nameKey)}
                              </div>
                              <div className={`text-xs mt-0.5 ${
                                isSubActive ? 'text-blue-400/80' : 'text-slate-400'
                              }`}>
                                {t(subItem.descriptionKey)}
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            } else {
              // Regular Menu Item
              const isActive = isMenuActive(item)
              
              return (
                <Link
                  key={item.nameKey}
                  href={item.href!}
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
            }
          })}
        </nav>
      </div>

      {/* Logout Button */}
      <div className={`${collapsed ? 'p-3' : 'p-6'} pt-0 transition-all duration-300`}>
        <button
          onClick={() => {
            logout()
            if (onItemClick) onItemClick()
          }}
          className={`
            w-full flex items-center gap-3 p-3 rounded-lg transition-colors duration-200 relative group
            text-slate-300 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/30
            ${collapsed ? 'justify-center' : ''}
          `}
          title={collapsed ? t('navigation.logout') : undefined}
        >
          <LogOut className={`w-5 h-5 ${collapsed ? '' : 'mt-0.5'} flex-shrink-0`} />
          
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="font-medium">
                {t('navigation.logout')}
              </div>
              <div className="text-sm mt-0.5 text-slate-400">
                {t('navigation.logoutDesc')}
              </div>
            </div>
          )}

          {/* Tooltip for collapsed state */}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-sm text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-slate-600">
              {t('navigation.logout')}
            </div>
          )}
        </button>
      </div>
    </div>
  )
}