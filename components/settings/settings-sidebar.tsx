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

interface MenuListType {
  nameKey: string
  icon: React.ElementType
  descriptionKey: string
  expandable?: boolean
  menuId: string
  submenu?: SubMenuListType[]
  disabled?: boolean
  href?: string
}
interface SubMenuListType {
  nameKey: string
  icon: React.ElementType
  descriptionKey: string
  href: string
  disabled?: boolean
}

export function SettingsSidebar({ onItemClick, collapsed = false, onToggleCollapse }: SettingsSidebarProps) {
  const pathname = usePathname()
  const { t, locale } = useI18n()
  const { logout } = useAuth()
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    wishlists: true
  })

  const navigationItems:MenuListType[] = [
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
          descriptionKey: 'settings.wishlists.customizeDesc',
          disabled: true
        }
      ]
    },
    {
      nameKey: 'settings.appearance.title',
      href: `/${locale}/settings/appearance`,
      icon: PaintBrushIcon,
      menuId: 'appearance',
      descriptionKey: 'settings.appearance.description'
    },
    {
      nameKey: 'settings.notifications.title',
      href: `/${locale}/settings/notifications`,
      icon: BellIcon,
      menuId: 'notifications',
      descriptionKey: 'settings.notifications.description'
    },
    {
      nameKey: 'settings.profile.title',
      href: `/${locale}/settings/profile`,
      icon: UserIcon,
      menuId: 'profile',
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
                      flex items-start gap-3 p-3 rounded-lg transition-colors duration-200 relative group
                      ${isActive 
                        ? 'bg-blue-600/20 border border-blue-500/30 text-blue-300' 
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                      }
                      ${collapsed ? 'justify-center' : ''}
                      ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    disabled={item.disabled}
                    title={collapsed ? t(item.nameKey) : undefined}
                  >
                    <item.icon className={`w-5 h-5 ${collapsed ? '' : 'mt-0.5'} flex-shrink-0 ${
                      isActive ? 'text-blue-400' : 'text-slate-400'
                    }`} />
                    
                    {!collapsed && (
                      <>
                        <div className="flex-1 flex items-start flex-col min-w-0 w-full">
                          <div className={`font-medium ${
                            isActive ? 'text-blue-300' : 'text-slate-200'
                          } ${item.disabled ? 'opacity-50' : ''}`}>
                            {t(item.nameKey)}
                          </div>
                          <div className={`text-sm mt-0.5 text-start ${
                            isActive ? 'text-blue-400/80' : 'text-slate-400'
                          } ${item.disabled ? 'opacity-50' : ''}`}>
                            {t(item.descriptionKey) || item.descriptionKey}
                          </div>
                        </div>
                        <div className="flex-shrink-0 mt-0.5">
                          {isExpanded ? (
                            <ChevronUpIcon className={`w-4 h-4 text-slate-400 ${item.disabled ? 'opacity-50' : ''}`} />
                          ) : (
                            <ChevronDownIcon className={`w-4 h-4 text-slate-400 ${item.disabled ? 'opacity-50' : ''}`} />
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
                            onClick={e => {
                              if (subItem.disabled) {
                                e.preventDefault()
                              }
                            }}
                            className={`
                              flex items-start gap-3 p-2 rounded-lg transition-colors duration-200
                              ${isSubActive 
                                ? 'bg-blue-600/20 border border-blue-500/30 text-blue-300' 
                                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                              }
                              ${subItem.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                          >
                            <subItem.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                              isSubActive ? 'text-blue-400' : 'text-slate-400'
                            } ${subItem.disabled ? 'opacity-50' : ''}`} />
                            
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium text-sm ${
                                isSubActive ? 'text-blue-300' : 'text-slate-200'
                              } ${subItem.disabled ? 'opacity-50' : ''}`}>
                                {t(subItem.nameKey)}
                              </div>
                              <div className={`text-xs mt-0.5 ${
                                isSubActive ? 'text-blue-400/80' : 'text-slate-400'
                              } ${subItem.disabled ? 'opacity-50' : ''}`}>
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
                  onClick={e => {
                    if (item.disabled) {
                      e.preventDefault()
                    }
                  }}
                  className={`
                    flex items-start gap-3 p-3 rounded-lg transition-colors duration-200 relative group
                    ${isActive 
                      ? 'bg-blue-600/20 border border-blue-500/30 text-blue-300' 
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }
                    ${collapsed ? 'justify-center' : ''}
                    ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
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
                      } ${item.disabled ? 'opacity-50' : ''}`}>
                        {t(item.nameKey)}
                      </div>
                      <div className={`text-sm mt-0.5 ${
                        isActive ? 'text-blue-400/80' : 'text-slate-400'
                      } ${item.disabled ? 'opacity-50' : ''}`}>
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