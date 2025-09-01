'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PaintBrushIcon, SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'

export default function AppearancePage() {
  const { t } = useI18n()
  const [settings, setSettings] = useState({
    theme: 'dark', // 'light', 'dark', 'system'
    language: 'ko',
    fontSize: 'medium', // 'small', 'medium', 'large'
    compactMode: false
  })

  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
  }

  const ThemeOption = ({ 
    theme, 
    icon: Icon, 
    title, 
    description 
  }: { 
    theme: string
    icon: any
    title: string
    description: string 
  }) => (
    <button
      onClick={() => setSettings(prev => ({ ...prev, theme }))}
      className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
        settings.theme === theme
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'
      }`}
    >
      <Icon className={`w-6 h-6 mt-1 ${
        settings.theme === theme ? 'text-blue-400' : 'text-slate-400'
      }`} />
      <div className="text-left">
        <div className={`font-medium ${
          settings.theme === theme ? 'text-blue-300' : 'text-slate-200'
        }`}>
          {title}
        </div>
        <div className="text-sm text-slate-400 mt-1">
          {description}
        </div>
      </div>
    </button>
  )

  const SelectOption = ({ 
    value, 
    label, 
    options, 
    onChange 
  }: { 
    value: string
    label: string
    options: { value: string, label: string }[]
    onChange: (value: string) => void
  }) => (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t('settings.appearance.title')}</h1>
        <p className="text-slate-300">
          {t('settings.appearance.description')}
        </p>
      </div>

      {/* Theme Selection */}
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-6">{t('settings.appearance.theme')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <ThemeOption
              theme="light"
              icon={SunIcon}
              title={t('settings.appearance.lightMode')}
              description={t('settings.appearance.lightMode')}
            />
            <ThemeOption
              theme="dark"
              icon={MoonIcon}
              title={t('settings.appearance.darkMode')}
              description={t('settings.appearance.darkMode')}
            />
            <ThemeOption
              theme="system"
              icon={ComputerDesktopIcon}
              title={t('settings.appearance.systemMode')}
              description={t('settings.appearance.systemMode')}
            />
          </div>
        </div>
      </Card>

      {/* Display Settings */}
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-6">디스플레이</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SelectOption
              value={settings.language}
              label={t('settings.appearance.language')}
              options={[
                { value: 'kr', label: '한국어' },
                { value: 'en', label: 'English' },
                { value: 'jp', label: '日本語' }
              ]}
              onChange={(language) => setSettings(prev => ({ ...prev, language }))}
            />

            <SelectOption
              value={settings.fontSize}
              label={t('settings.appearance.fontSize')}
              options={[
                { value: 'small', label: '작게' },
                { value: 'medium', label: '보통' },
                { value: 'large', label: '크게' }
              ]}
              onChange={(fontSize) => setSettings(prev => ({ ...prev, fontSize }))}
            />
          </div>

          <div className="mt-6">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.compactMode}
                onChange={(e) => setSettings(prev => ({ ...prev, compactMode: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-slate-900/50 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div>
                <div className="text-slate-200 font-medium">{t('settings.appearance.compactMode')}</div>
                <div className="text-slate-400 text-sm">더 많은 정보를 화면에 표시</div>
              </div>
            </label>
          </div>
        </div>
      </Card>

      {/* Preview */}
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-6">미리보기</h2>
          
          <div className="border border-slate-600 rounded-lg p-4 bg-slate-900/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
              <div>
                <div className={`font-medium text-slate-200 ${
                  settings.fontSize === 'small' ? 'text-sm' : 
                  settings.fontSize === 'large' ? 'text-lg' : 'text-base'
                }`}>
                  위시리스트 예시
                </div>
                <div className={`text-slate-400 ${
                  settings.fontSize === 'small' ? 'text-xs' : 
                  settings.fontSize === 'large' ? 'text-base' : 'text-sm'
                }`}>
                  이것은 설정에 따른 미리보기입니다
                </div>
              </div>
            </div>
            <div className={`text-slate-300 ${
              settings.fontSize === 'small' ? 'text-sm' : 
              settings.fontSize === 'large' ? 'text-lg' : 'text-base'
            } ${settings.compactMode ? 'leading-tight' : 'leading-relaxed'}`}>
              현재 설정: {settings.theme === 'light' ? '라이트' : settings.theme === 'dark' ? '다크' : '시스템'} 테마, {
                settings.fontSize === 'small' ? '작은' : settings.fontSize === 'large' ? '큰' : '보통'
              } 글자 크기
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          loading={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {t('common.save')}
        </Button>
      </div>
    </div>
  )
}