'use client'

import { Card } from '@/components/ui/card'
import { SwatchIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'

export default function EmptyState() {
  const { t } = useI18n()

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <div className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-700/50 rounded-full flex items-center justify-center">
          <SwatchIcon className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">{t('settings.customize.selectWishlist')}</h3>
        <p className="text-slate-400">
          {t('settings.customize.selectWishlistDesc')}
        </p>
      </div>
    </Card>
  )
}