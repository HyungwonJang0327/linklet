'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

import { en } from '@/shared/i18n/dictionaries/en'
import { ja } from '@/shared/i18n/dictionaries/ja'
import { ko } from '@/shared/i18n/dictionaries/ko'
import { EMPTY_STATE_ACTION_CLASS, EmptyState } from '@/shared/ui/empty-state'
import { MODE_SCRIPT } from '@/shared/ui/mode-script'
import { MultilingualLines } from '@/shared/ui/multilingual-lines'

import './globals.css'

// 전역 에러 경계 — FEATURES F06, error-handling E4 "F06 구현 결정". root layout([locale]/layout.tsx) 자체가 깨졌을 때만 뜬다.
// 이 파일이 root layout 을 통째로 대체하므로 <html>·<body>·globals.css 를 직접 그린다(error.md "Global Error").
// 클라이언트 컴포넌트라 metadata 를 못 쓴다 → React <title>. I18nProvider 도 없어 요청 언어를 모른다 → 세 언어 고정 문구를
// 각 사전 모듈의 같은 키에서 직접 가져온다(문자열 이중화 금지. getDictionary 는 비동기라 여기서 못 쓴다).
// error.message·digest 는 화면에 출력하지 않는다(§4-1). 전송: 경계가 받은 error 를 Sentry 로([locale]/error.tsx 와 같은 규약, E5).
// 스킨·모드는 layout 과 같은 정적 기본값 + MODE_SCRIPT (design-tokens.md Phase 1). F29 가 저장값을 반영할 때 같이 바꾼다.

type GlobalErrorProps = {
  error: Error & { digest?: string }
  retry: () => void
}

const TITLES = { ko: ko.errorPage.title, en: en.errorPage.title, ja: ja.errorPage.title } as const
const DESCRIPTIONS = {
  ko: ko.errorPage.description,
  en: en.errorPage.description,
  ja: ja.errorPage.description,
} as const
const RETRY_LABEL = [ko.common.retry, en.common.retry, ja.common.retry].join(' · ')

export default function GlobalError({ error, retry }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="ko" data-skin="canvas" data-mode="light">
      <head>
        <title>{`${TITLES.ko} — ${ko.common.appName}`}</title>
        <script dangerouslySetInnerHTML={{ __html: MODE_SCRIPT }} />
      </head>
      <body className="bg-page text-fg text-body">
        <main>
          <EmptyState
            title={<MultilingualLines texts={TITLES} />}
            description={<MultilingualLines texts={DESCRIPTIONS} />}
            action={
              <button type="button" onClick={() => retry()} className={EMPTY_STATE_ACTION_CLASS}>
                {RETRY_LABEL}
              </button>
            }
          />
        </main>
      </body>
    </html>
  )
}
