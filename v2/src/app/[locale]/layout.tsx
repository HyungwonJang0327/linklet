import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getDictionary, I18nProvider, isLocale, LOCALES } from '@/shared/i18n'
import { MODE_SCRIPT } from '@/shared/ui/mode-script'
import { Topbar } from '@/shared/ui/topbar'

import '../globals.css'

// 언어별 root layout — FEATURES F03, decisions/architecture.md A6, i18n.md L1·L6.
// app/layout.tsx 는 없다: 이 파일이 root 라 <html>·<body> 를 여기서 그린다(Next 16 다중 root layout — layout.md "Root Layout").
// 공유 페이지 /w/{shareId} 는 F23 때 app/w/layout.tsx 가 별도 root 가 된다. `/` 는 F05 proxy 가 언어 경로로 보낸다.
// 지원하지 않는 locale 은 notFound() — 전역 404 화면은 F06(global-not-found 채택 여부)에서.

type LocaleParams = Pick<LayoutProps<'/[locale]'>, 'params'>

/** 세 언어를 빌드 때 정적 생성한다 (generate-static-params.md). 그 밖의 값은 요청 때 layout 이 404 로 보낸다 */
export function generateStaticParams(): { locale: string }[] {
  return LOCALES.map((locale) => ({ locale }))
}

/** <title>·description 을 그 언어 사전의 metadata.* 로 — create-next-app 기본값('Create Next App') 제거 */
export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dictionary = await getDictionary(locale)
  return { title: dictionary.metadata.title, description: dictionary.metadata.description }
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  // params 는 Promise (CLAUDE.md 함정 14)
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dictionary = await getDictionary(locale)

  return (
    // 스킨·모드 정적 기본값 (design-tokens.md Phase 1). F29 가 저장값(스킨·모드)을 반영하고, 저장값이 없으면
    // data-mode 를 비워 아래 MODE_SCRIPT 가 시스템 선호로 채우게 한다 — 지금은 light 고정이라 스크립트는 대기 상태
    <html lang={locale} data-skin="canvas" data-mode="light">
      <head>
        {/* 첫 페인트 전에 data-mode 를 채우는 인라인 스크립트. CSP 도입 때 nonce 를 붙인다 (design-tokens.md) */}
        <script dangerouslySetInnerHTML={{ __html: MODE_SCRIPT }} />
      </head>
      <body className="bg-page text-fg text-body">
        {/* 클라이언트 컴포넌트의 useT()·useLocale() 공급 (i18n L6). 서버 컴포넌트는 같은 사전으로 createT */}
        <I18nProvider locale={locale} dictionary={dictionary}>
          <Topbar locale={locale} />
          <main>{children}</main>
        </I18nProvider>
      </body>
    </html>
  )
}
