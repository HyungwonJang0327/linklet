'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'

export default function CreateWishlistCard() {
  const { t } = useI18n()

  return (
    <Card className="bg-slate-800/30 border-slate-700/30 border-dashed backdrop-blur-sm">
      <div className="p-6 flex flex-col items-center justify-center min-h-[280px] text-center">
        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
          <PlusIcon className="w-6 h-6 text-blue-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">
          {t('wishlist.create')}
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          새로운 위시리스트를 만들어보세요
        </p>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <PlusIcon className="w-4 h-4 mr-2" />
          {t('common.add')}
        </Button>
      </div>
    </Card>
  )
}