'use client'

import { Button } from '@/components/ui/button'
import { EyeIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'

interface CustomizeHeaderProps {
  showPreview: boolean
  onTogglePreview: () => void
  onSave: () => void
  loading: boolean
  selectedWishlist: any
}

export default function CustomizeHeader({ 
  showPreview, 
  onTogglePreview, 
  onSave, 
  loading, 
  selectedWishlist 
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
            onClick={onSave}
            loading={loading}
            disabled={!selectedWishlist}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedWishlist ? t('settings.customize.saveChanges') : t('settings.customize.selectWishlist')}
          </Button>
        </div>
      </div>
    </div>
  )
}