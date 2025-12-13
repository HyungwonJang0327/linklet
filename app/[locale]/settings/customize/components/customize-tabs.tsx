'use client'

import { Card } from '@/components/ui/card'
import {
  PaintBrushIcon,
  RectangleStackIcon,
  UserCircleIcon,
  LinkIcon,
  SwatchIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'

interface CustomizeTabsProps {
  activeTab: 'presets' | 'theme' | 'layout' | 'colors' | 'profile' | 'social'
  onTabChange: (tab: 'presets' | 'theme' | 'layout' | 'colors' | 'profile' | 'social') => void
}

export default function CustomizeTabs({ activeTab, onTabChange }: CustomizeTabsProps) {
  const { t } = useI18n()

  const tabs = [
    { id: 'presets', name: t('settings.customize.tabs.presets'), icon: SparklesIcon },
    { id: 'theme', name: t('settings.customize.tabs.theme'), icon: PaintBrushIcon },
    { id: 'layout', name: t('settings.customize.tabs.layout'), icon: RectangleStackIcon },
    { id: 'colors', name: t('settings.customize.tabs.colors'), icon: SwatchIcon },
    { id: 'profile', name: t('settings.customize.tabs.profile'), icon: UserCircleIcon },
    // { id: 'social', name: t('settings.customize.tabs.social'), icon: LinkIcon }
  ]

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm p-1">
      <div className="flex flex-wrap gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </button>
        ))}
      </div>
    </Card>
  )
}