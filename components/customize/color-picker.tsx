'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n/context'

interface ColorPickerProps {
  colors: {
    primary: string
    background: string
    text: string
    accent: string
  }
  onColorsChange: (colors: any) => void
}

const presetColors = {
  primary: [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ],
  background: [
    '#0f172a', '#1e293b', '#374151', '#1f2937',
    '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0'
  ],
  accent: [
    '#6366f1', '#f43f5e', '#059669', '#d97706',
    '#7c3aed', '#db2777', '#0891b2', '#65a30d'
  ]
}

export function ColorPicker({ colors, onColorsChange }: ColorPickerProps) {
  const { t } = useI18n()
  const [activeColorType, setActiveColorType] = useState<'primary' | 'background' | 'text' | 'accent'>('primary')

  const ColorInput = ({ 
    label, 
    value, 
    type, 
    description 
  }: { 
    label: string
    value: string
    type: keyof typeof colors
    description: string 
  }) => (
    <div 
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        activeColorType === type 
          ? 'border-blue-500 bg-blue-500/10' 
          : 'border-slate-600 hover:border-slate-500'
      }`}
      onClick={() => setActiveColorType(type)}
    >
      <div className="flex items-center gap-3 mb-2">
        <div 
          className="w-8 h-8 rounded-lg border-2 border-slate-600" 
          style={{ backgroundColor: value }}
        ></div>
        <div>
          <div className="text-slate-200 font-medium">{label}</div>
          <div className="text-slate-400 text-sm">{description}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onColorsChange({ ...colors, [type]: e.target.value })}
          className="w-full h-8 rounded border-0 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onColorsChange({ ...colors, [type]: e.target.value })}
          className="w-24 px-2 py-1 bg-slate-900/50 border border-slate-600 rounded text-white text-sm font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  )

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">{t('settings.customize.colors.title')}</h2>
        <p className="text-slate-400 text-sm mb-6">
          {t('settings.customize.colors.description')}
        </p>

        {/* Color Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <ColorInput
            label={t('settings.customize.colors.primary')}
            value={colors.primary}
            type="primary"
            description={t('settings.customize.colors.primaryDesc')}
          />
          <ColorInput
            label={t('settings.customize.colors.background')}
            value={colors.background}
            type="background"
            description={t('settings.customize.colors.backgroundDesc')}
          />
          <ColorInput
            label={t('settings.customize.colors.text')}
            value={colors.text}
            type="text"
            description={t('settings.customize.colors.textDesc')}
          />
          <ColorInput
            label={t('settings.customize.colors.accent')}
            value={colors.accent}
            type="accent"
            description={t('settings.customize.colors.accentDesc')}
          />
        </div>

        {/* Preset Colors */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-white mb-4">
            {activeColorType === 'primary' && t('settings.customize.colors.primaryPreset')}
            {activeColorType === 'background' && t('settings.customize.colors.backgroundPreset')}
            {activeColorType === 'text' && t('settings.customize.colors.textPreset')}
            {activeColorType === 'accent' && t('settings.customize.colors.accentPreset')}
          </h3>
          
          <div className="grid grid-cols-8 gap-2">
            {(activeColorType === 'text' ? 
              ['#ffffff', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155'] :
              presetColors[activeColorType as keyof typeof presetColors] || presetColors.primary
            ).map((color) => (
              <button
                key={color}
                onClick={() => onColorsChange({ ...colors, [activeColorType]: color })}
                className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                  colors[activeColorType] === color 
                    ? 'border-white shadow-lg' 
                    : 'border-slate-600 hover:border-slate-400'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Color Harmony Suggestions */}
        <div className="pt-6 border-t border-slate-700/50">
          <h3 className="text-lg font-medium text-white mb-4">{t('settings.customize.colors.recommendations')}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { nameKey: 'settings.customize.colors.blueMonochrome', colors: { primary: '#3b82f6', background: '#0f172a', text: '#ffffff', accent: '#60a5fa' }},
              { nameKey: 'settings.customize.colors.sunsetGradient', colors: { primary: '#f59e0b', background: '#1e293b', text: '#fbbf24', accent: '#f97316' }},
              { nameKey: 'settings.customize.colors.forestGreen', colors: { primary: '#10b981', background: '#064e3b', text: '#ecfdf5', accent: '#34d399' }},
              { nameKey: 'settings.customize.colors.purpleNight', colors: { primary: '#8b5cf6', background: '#1e1b4b', text: '#f3f4f6', accent: '#a78bfa' }},
              { nameKey: 'settings.customize.colors.minimalWhite', colors: { primary: '#1f2937', background: '#ffffff', text: '#111827', accent: '#6b7280' }},
              { nameKey: 'settings.customize.colors.pinkDream', colors: { primary: '#ec4899', background: '#1f2937', text: '#fce7f3', accent: '#f472b6' }}
            ].map((preset) => (
              <button
                key={preset.nameKey}
                onClick={() => onColorsChange(preset.colors)}
                className="p-3 rounded-lg border border-slate-600 hover:border-slate-500 transition-all group"
              >
                <div className="flex gap-1 mb-2">
                  {Object.values(preset.colors).map((color, index) => (
                    <div
                      key={index}
                      className="flex-1 h-6 rounded"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="text-slate-200 text-sm font-medium group-hover:text-white">
                  {t(preset.nameKey)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Options */}
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <h3 className="text-lg font-medium text-white mb-4">{t('settings.customize.colors.advancedSettings')}</h3>

          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 bg-slate-900/50 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div>
                <div className="text-slate-200 font-medium">{t('settings.customize.colors.gradientBackground')}</div>
                <div className="text-slate-400 text-sm">{t('settings.customize.colors.gradientBackgroundDesc')}</div>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 bg-slate-900/50 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div>
                <div className="text-slate-200 font-medium">{t('settings.customize.colors.darkMode')}</div>
                <div className="text-slate-400 text-sm">{t('settings.customize.colors.darkModeDesc')}</div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </Card>
  )
}