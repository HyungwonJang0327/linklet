import type { Metadata } from 'next'

import { en } from '@/shared/i18n/dictionaries/en'
import { ja } from '@/shared/i18n/dictionaries/ja'
import { ko } from '@/shared/i18n/dictionaries/ko'
import { EMPTY_STATE_ACTION_CLASS, EmptyState } from '@/shared/ui/empty-state'
import { MODE_SCRIPT } from '@/shared/ui/mode-script'
import { MultilingualLines } from '@/shared/ui/multilingual-lines'

import './globals.css'

// 전역 404 — FEATURES F06, error-handling E4 "F06 구현 결정"(사용자 결정 2026-11-19: experimental.globalNotFound 채택).
// 어느 root layout 에도 걸리지 않는 경로(/xx — dynamicParams=false, /foo, /login …)에 Next 가 렌더 없이 이 문서를 바로 돌려준다
// (not-found.md "global-not-found.js"). layout 을 거치지 않으므로 <html>·<body>·globals.css 를 직접 그리고, 헤더를 못 읽어
// 요청 언어를 모른다 → 세 언어 고정 문구를 각 사전의 같은 키에서 가져온다(문자열 이중화 금지). /{locale}/없는-경로 는 [locale]/not-found.tsx.
// 홈 링크는 `/` — proxy(F05)가 Accept-Language 로 언어 경로에 보낸다. 16.3 실험 플래그: Next 업그레이드 때 이름·안정화 여부 확인(dependencies.md).

const TITLES = { ko: ko.notFound.title, en: en.notFound.title, ja: ja.notFound.title } as const
const DESCRIPTIONS = {
  ko: ko.notFound.description,
  en: en.notFound.description,
  ja: ja.notFound.description,
} as const
const HOME_LABEL = [ko.notFound.home, en.notFound.home, ja.notFound.home].join(' · ')

export const metadata: Metadata = {
  title: `${TITLES.ko} — ${ko.common.appName}`,
}

export default function GlobalNotFound() {
  return (
    <html lang="ko" data-skin="canvas" data-mode="light">
      <head>
        <script dangerouslySetInnerHTML={{ __html: MODE_SCRIPT }} />
      </head>
      <body className="bg-page text-fg text-body">
        <main>
          <EmptyState
            title={<MultilingualLines texts={TITLES} />}
            description={<MultilingualLines texts={DESCRIPTIONS} />}
            action={
              // 이 문서는 layout·앱 라우터 컨텍스트 없이 렌더된다(not-found.md) — next/link 대신 전체 로드 <a>. `/` 는 proxy 307 이라 Link 이점도 없다
              // eslint-disable-next-line @next/next/no-html-link-for-pages
              <a href="/" className={EMPTY_STATE_ACTION_CLASS}>
                {HOME_LABEL}
              </a>
            }
          />
        </main>
      </body>
    </html>
  )
}
