'use client'

import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/context'

interface FormActionsProps {
  onBack: () => void
  loading: boolean
  hasIncompleteMetadata?: boolean
}

export default function FormActions({ onBack, loading, hasIncompleteMetadata }: FormActionsProps) {
  const { t } = useI18n()

  const isDisabled = loading || hasIncompleteMetadata

  return (
    <div className="flex flex-col gap-3 pt-4">
      {hasIncompleteMetadata && !loading && (
        <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-3">
          <p className="text-blue-300 text-sm text-center">
            {t('wishlist.create.metadataExtractingHint') || '일부 링크의 메타데이터를 추출 중입니다. 완료될 때까지 기다려주세요.'}
          </p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
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
          disabled={isDisabled}
          className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {hasIncompleteMetadata && !loading
            ? (t('wishlist.create.extracting') || '추출 중...')
            : (t('wishlist.create.submit') || t('wishlist.createButton'))
          }
        </Button>
      </div>
    </div>
  )
}