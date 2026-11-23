'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

import { useT } from '@/shared/i18n'
import { EMPTY_STATE_ACTION_CLASS, EmptyState } from '@/shared/ui/empty-state'

// [locale] 구간 에러 경계 — FEATURES F06, error-handling E4. 에러 경계는 클라이언트 컴포넌트여야 한다(error.md).
// root layout 안(I18nProvider 아래)에서 그려지므로 useT() 와 토큰이 그대로 적용된다. layout 자체가 깨지면 app/global-error.tsx.
// props 는 Next 16 의 { error, retry } — retry() 는 자식을 다시 fetch·렌더한다(reset 아님, error.md "retry").
// error.message·error.digest 는 화면에 출력하지 않는다(§4-1 내부 메시지 노출 금지).
// 전송: 경계가 받은 error 를 Sentry 로(E5 기록 지점 "에러 경계(클라이언트)"). 서버 렌더 에러는 운영에서 메시지가 digest 로
// 대체돼 오고 서버 쪽은 instrumentation.ts onRequestError 가 이미 보냈다 — 그래도 보낸다(Sentry 규약: 클라이언트 렌더 에러는 여기서만 잡힌다).
// 개인정보 제거는 SDK 초기화의 beforeSend(shared/lib/sentry-scrub). DSN 이 없으면 SDK 가 조용히 버린다.

type ErrorBoundaryProps = {
  error: Error & { digest?: string }
  retry: () => void
}

export default function LocaleError({ error, retry }: ErrorBoundaryProps) {
  const t = useT()

  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

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
