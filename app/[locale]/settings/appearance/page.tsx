'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/context'
import SelectOption from './components/select-option'
import AppearancePreview from './components/appearance-preview'

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


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t('settings.appearance.title')}</h1>
        <p className="text-slate-300">
          {t('settings.appearance.description')}
        </p>
      </div>

      {/* Theme Selection */}
      {/* <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-6">{t('settings.appearance.theme')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <ThemeOption
              theme="light"
              icon={SunIcon}
              title={t('settings.appearance.lightMode')}
              description={t('settings.appearance.lightMode')}
              currentTheme={settings.theme}
              onThemeChange={(theme) => setSettings(prev => ({ ...prev, theme }))}
            />
            <ThemeOption
              theme="dark"
              icon={MoonIcon}
              title={t('settings.appearance.darkMode')}
              description={t('settings.appearance.darkMode')}
              currentTheme={settings.theme}
              onThemeChange={(theme) => setSettings(prev => ({ ...prev, theme }))}
            />
            <ThemeOption
              theme="system"
              icon={ComputerDesktopIcon}
              title={t('settings.appearance.systemMode')}
              description={t('settings.appearance.systemMode')}
              currentTheme={settings.theme}
              onThemeChange={(theme) => setSettings(prev => ({ ...prev, theme }))}
            />
          </div>
        </div>
      </Card> */}

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
          <AppearancePreview settings={settings} />
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