'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'

interface CreateHeaderProps {
  onBack: () => void
}

export default function CreateHeader({ onBack }: CreateHeaderProps) {
  const { t } = useI18n()

  return (
    <>
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-slate-300 hover:text-white hover:bg-slate-700/50 p-2"
        >
          <ArrowLeftIcon className="w-5 h-5" />
{t('common.back') || '돌아가기'}
        </Button>
      </div>
      <div className="flex items-center gap-4">
<h1 className="text-3xl font-bold text-white">{t('wishlist.createButton')}</h1>
        <p className="text-slate-300 mt-1">
{t('wishlist.create.subtitle') || '새로운 위시리스트를 만들어 원하는 상품들을 정리해보세요'}
        </p>
      </div>
    </>
  )
}