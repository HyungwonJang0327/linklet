'use client'

import { useT } from '@/shared/i18n'
import { EMPTY_STATE_ACTION_CLASS, EmptyState } from '@/shared/ui/empty-state'

// [locale] 구간 에러 경계 — FEATURES F06, error-handling E4. 에러 경계는 클라이언트 컴포넌트여야 한다(error.md).
// root layout 안(I18nProvider 아래)에서 그려지므로 useT() 와 토큰이 그대로 적용된다. layout 자체가 깨지면 app/global-error.tsx.
// props 는 Next 16 의 { error, retry } — retry() 는 자식을 다시 fetch·렌더한다(reset 아님, error.md "retry").
// error.message·error.digest 는 화면에 출력하지 않는다(§4-1 내부 메시지 노출 금지). 로그도 여기서 남기지 않는다 —
// 서버 쪽은 Next 가 이미 기록하고, 클라이언트 전송은 Sentry 연결(F06 다음 항목)에서 한 곳에 붙인다.

type ErrorBoundaryProps = {
  error: Error & { digest?: string }
  retry: () => void
}

export default function LocaleError({ retry }: ErrorBoundaryProps) {
  const t = useT()

  return (
    <EmptyState
      title={t('errorPage.title')}
      description={t('errorPage.description')}
      action={
        <button type="button" onClick={() => retry()} className={EMPTY_STATE_ACTION_CLASS}>
          {t('common.retry')}
        </button>
      }
    />
  )
}
