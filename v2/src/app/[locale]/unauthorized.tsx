import { locale as rootLocale } from 'next/root-params'

import { GoogleSignInButton } from '@/features/auth'
import { createT, DEFAULT_LOCALE, getDictionary, isLocale } from '@/shared/i18n'
import { EmptyState } from '@/shared/ui/empty-state'

// [locale] 구간 401 — FEATURES F09. (app)·admin layout 이 unauthorized() 를 부르면 Next 가 401 상태로 이 화면을 그린다
// (experimental.authInterrupts, unauthorized.md). root layout 안이라 Topbar·토큰·<html lang> 그대로.
// 리다이렉트 대신 제자리 401(사용자 결정 2026-11-23): URL 이 보호 화면 그대로라 Google 버튼의 callbackURL 을 현재 경로로 두면
// 로그인 뒤 원래 자리로 돌아온다 — 기존 앱에 없던 "돌아오기" 가 따로 구현 없이 해결된다.
// props 는 받지 않는다(unauthorized.md "Props") — locale 은 not-found.tsx 와 같은 방식(next/root-params).
export default async function LocaleUnauthorized() {
  const raw = await rootLocale()
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE
  const t = createT(await getDictionary(locale))

  return (
    <EmptyState
      title={t('unauthorized.title')}
      description={t('unauthorized.description')}
      action={<GoogleSignInButton returnTo="current" />}
    />
  )
}
