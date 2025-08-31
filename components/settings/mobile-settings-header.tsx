'use client'

import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

interface MobileSettingsHeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export function MobileSettingsHeader({ 
  sidebarOpen, 
  setSidebarOpen 
}: MobileSettingsHeaderProps) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 px-4 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">설정</h1>
        
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
          aria-label="메뉴 열기/닫기"
        >
          {sidebarOpen ? (
            <XMarkIcon className="w-6 h-6" />
          ) : (
            <Bars3Icon className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  )
}