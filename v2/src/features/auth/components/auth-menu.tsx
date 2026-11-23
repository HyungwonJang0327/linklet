'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

import { useLocale, useT } from '@/shared/i18n'

import { authClient } from '../hooks/auth-client'

// Topbar 오른쪽 로그인 상태 — FEATURES F08 (로그인 링크 / 로그아웃 버튼). [locale]/layout 이 Topbar 의 actions 슬롯에 넣는다.
// 클라이언트에서 useSession 으로 읽는다(기존 앱의 useSession 과 같은 방식): 서버에서 세션을 읽으면 root layout 이 요청마다 동적 렌더가 되고
// 랜딩·로그인 같은 공개 화면까지 DB 조회가 붙는다. 쿠키가 없으면 SDK 가 DB 없이 null 을 돌려주므로 비로그인 방문은 DB 에 가지 않는다.
// 서버가 세션을 알아야 하는 화면(F09·F13)은 features/auth getSession 을 따로 쓴다.
// - 로딩 중(isPending)·로그인 페이지에서는 아무것도 그리지 않는다(깜빡임·중복 안내 방지)
// - 로그아웃 뒤 랜딩으로 이동 + router.refresh() — 서버가 그린 로그인 상태 화면(F13 이후)이 캐시에 남지 않게(ESLint: location.assign 대신 useRouter)
const SIGN_IN_LINK_CLASS =
  'inline-flex min-h-touch items-center rounded-sm px-2 text-label text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'

export function AuthMenu() {
  const t = useT()
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [signingOut, setSigningOut] = useState(false)

  if (isPending || pathname === `/${locale}/login`) return null

  if (session === null) {
    return (
      <a href={`/${locale}/login`} className={SIGN_IN_LINK_CLASS}>
        {t('auth.signIn')}
      </a>
    )
  }

  async function signOut(): Promise<void> {
    setSigningOut(true)
    const { error } = await authClient.signOut()
    if (error) {
      setSigningOut(false)
      return
    }
    router.push(`/${locale}`)
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={signingOut}
      aria-busy={signingOut}
      className={`${SIGN_IN_LINK_CLASS} disabled:opacity-60`}
    >
      {t('auth.signOut')}
    </button>
  )
}
