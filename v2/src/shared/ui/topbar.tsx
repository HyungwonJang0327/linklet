import type { Locale } from '@/shared/i18n'

// 최소 Topbar — FEATURES F03 (기존 ConditionalHeader 대체). 서버 컴포넌트, 토큰 클래스만 쓴다(원색·dark: 금지).
// 시안 design/mockups/base.css 의 .topbar(높이 56 → min-h-14, 좌우 --pad-x → px-page-x, sticky) · .wordmark(text-wordmark, accent-text)
// 를 Tailwind 토큰 유틸리티로 옮겼다. 시안의 반투명 color-mix 배경은 쓰지 않고 불투명 bg-page (design-tokens.md 결정).
// 내비(위시리스트·설정)·아바타는 F09/F13 에서 붙인다. 워드마크는 브랜드명이라 번역하지 않는다(세 사전의 common.appName 모두 'Linklet').
// 링크는 전체 로드 <a> — 언어 root 를 넘나드는 이동(다중 root layout)은 어차피 전체 로드이며, 앱 내 이동이 생기는 F13 에서 Link 로 바꿀지 본다.

type TopbarProps = { locale: Locale }

export function Topbar({ locale }: TopbarProps) {
  return (
    <header className="sticky top-0 z-10 flex min-h-14 items-center gap-3 bg-page px-page-x py-1.5">
      <a
        href={`/${locale}`}
        className="text-wordmark rounded-sm tracking-[-0.02em] text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        Linklet
      </a>
    </header>
  )
}
