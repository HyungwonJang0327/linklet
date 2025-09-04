'use client'

import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/context'

interface FormActionsProps {
  onBack: () => void
  loading: boolean
}

export default function FormActions({ onBack, loading }: FormActionsProps) {
  const { t } = useI18n()

  return (
    <div className="flex items-center justify-end gap-3 pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        disabled={loading}
        className="text-slate-300 border-slate-600 hover:bg-slate-700"
      >
        {t('common.cancel') || '취소'}
      </Button>
      <Button
        type="submit"
        loading={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        {t('wishlist.create.submit') || t('wishlist.createButton')}
      </Button>
    </div>
  )
}