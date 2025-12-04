'use client'

import { Button } from '@/components/ui/button'
import { EyeIcon, CheckCircleIcon, ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'

interface CustomizeHeaderProps {
  showPreview: boolean
  onTogglePreview: () => void
  onSave: () => void
  loading: boolean
  selectedWishlist: any
  saveStatus: 'saved' | 'saving' | 'unsaved'
}

export default function CustomizeHeader({
  showPreview,
  onTogglePreview,
  onSave,
  loading,
  selectedWishlist,
  saveStatus
}: CustomizeHeaderProps) {
  const { t } = useI18n()

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('settings.customize.title')}</h1>
          <p className="text-slate-300">
            {t('settings.customize.description')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* 저장 상태 표시 */}
          {selectedWishlist && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50">
              {saveStatus === 'saving' && (
                <>
                  <ArrowPathIcon className="w-4 h-4 text-blue-400 animate-spin" />
                  <span className="text-sm text-blue-400">저장 중...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <CheckCircleIcon className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400">저장됨</span>
                </>
              )}
              {saveStatus === 'unsaved' && (
                <>
                  <ExclamationCircleIcon className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-yellow-400">저장 안 됨</span>
                </>
              )}
            </div>
          )}

          <Button
            variant={showPreview ? 'primary' : 'outline'}
            size="sm"
            onClick={onTogglePreview}
            className="hidden lg:flex"
          >
            <EyeIcon className="w-4 h-4 mr-2" />
            {t('settings.customize.preview')} {showPreview ? t('settings.customize.hidePreview') : t('settings.customize.showPreview')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            loading={loading}
            disabled={!selectedWishlist}
            className="text-slate-300 border-slate-600 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="수동 저장 (자동 저장이 활성화되어 있습니다)"
          >
            {selectedWishlist ? '수동 저장' : t('settings.customize.selectWishlist')}
          </Button>
        </div>
      </div>
    </div>
  )
}