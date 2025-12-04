'use client'

import { CUSTOMIZATION_PRESETS, CustomizationPreset } from '@/lib/constants/customization-presets'
import { useI18n } from '@/lib/i18n/context'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

interface PresetSelectorProps {
  onPresetSelect: (preset: CustomizationPreset) => void
  currentPresetId?: string | null
}

export function PresetSelector({ onPresetSelect, currentPresetId }: PresetSelectorProps) {
  const { t } = useI18n()

  return (
    <div className="bg-slate-800/50 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">
          {t('settings.customize.presets.title')}
        </h3>
        <p className="text-sm text-slate-400">
          {t('settings.customize.presets.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CUSTOMIZATION_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onPresetSelect(preset)}
            className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
              currentPresetId === preset.id
                ? 'border-blue-500 ring-2 ring-blue-500/50'
                : 'border-slate-600 hover:border-slate-500'
            }`}
          >
            {/* Preview */}
            <div
              className="h-32 p-4 flex flex-col justify-between"
              style={{
                background: `linear-gradient(135deg, ${preset.colors.background} 0%, ${preset.colors.primary} 100%)`
              }}
            >
              {/* Color swatches */}
              <div className="flex gap-2">
                <div
                  className="w-6 h-6 rounded-full border-2 border-white/50"
                  style={{ backgroundColor: preset.colors.primary }}
                />
                <div
                  className="w-6 h-6 rounded-full border-2 border-white/50"
                  style={{ backgroundColor: preset.colors.accent }}
                />
                <div
                  className="w-6 h-6 rounded-full border-2 border-white/50"
                  style={{ backgroundColor: preset.colors.text }}
                />
              </div>

              {/* Mini layout preview */}
              <div className="flex gap-1">
                {preset.layout === 'grid' && (
                  <>
                    <div className="w-8 h-8 bg-white/20 rounded" />
                    <div className="w-8 h-8 bg-white/20 rounded" />
                    <div className="w-8 h-8 bg-white/20 rounded" />
                  </>
                )}
                {preset.layout === 'list' && (
                  <div className="w-full h-8 bg-white/20 rounded" />
                )}
                {preset.layout === 'masonry' && (
                  <>
                    <div className="w-8 h-10 bg-white/20 rounded" />
                    <div className="w-8 h-6 bg-white/20 rounded" />
                    <div className="w-8 h-8 bg-white/20 rounded" />
                  </>
                )}
              </div>
            </div>

            {/* Name */}
            <div className="bg-slate-900 p-3">
              <p className="text-sm font-medium text-white">
                {t(`settings.customize.presets.${preset.id}.name`)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {t(`settings.customize.presets.${preset.id}.description`)}
              </p>
            </div>

            {/* Selected indicator */}
            {currentPresetId === preset.id && (
              <div className="absolute top-2 right-2">
                <CheckCircleIcon className="w-6 h-6 text-blue-400" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <p className="text-sm text-blue-300">
          💡 {t('settings.customize.presets.hint')}
        </p>
      </div>
    </div>
  )
}
