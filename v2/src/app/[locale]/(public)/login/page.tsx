import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { getRequester, GoogleSignInButton } from '@/features/auth'
import { createT, getDictionary, isLocale } from '@/shared/i18n'

// 로그인 — FEATURES F08, url-design `/{locale}/login`, 시안 design/mockups/landing.html "로그인 /ko/login":
// 워드마크 · 제목 · 한 줄 설명 · Google 버튼 하나. 폼이 없다(Google 로그인만). 시안의 이용약관·개인정보 처리방침 줄은 그 페이지가 생길 때 넣는다.
// ?error=1 (GoogleSignInButton 의 errorCallbackURL) 이면 안내 문구 한 줄 — 내부 코드·영어 원문은 보이지 않는다(§4-1).
// 이미 로그인한 사용자는 랜딩으로(F09, migrator-todo). 세션을 서버에서 검증해 판단한다 — proxy 에서 쿠키만 보고 보내면 만료 쿠키일 때
// 랜딩(로그인 링크)↔로그인 페이지를 오가게 된다. F13 뒤에는 /{locale}/wishlists 로 바꾼다(GoogleSignInButton callbackURL 과 같은 시점).

type LoginPageProps = PageProps<'/[locale]/login'>

export async function generateMetadata({ params }: LoginPageProps): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const t = createT(await getDictionary(locale))
  return { title: `${t('auth.signIn')} — ${t('common.appName')}` }
}

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const requester = await getRequester()
  if (requester.kind === 'user') redirect(`/${locale}`)
  const t = createT(await getDictionary(locale))
  const failed = (await searchParams).error !== undefined

  return (
    <div className="mx-auto flex max-w-[420px] flex-col items-start gap-4 px-page-x py-12">
      <span className="text-wordmark text-accent-fg">{t('common.appName')}</span>
      <h1 className="mt-3 text-display">{t('login.title')}</h1>
      <p className="text-body-lg text-muted">{t('login.description')}</p>
      {failed ? (
        <p role="alert" className="text-body text-danger">
          {t('login.failed')}
        </p>
      ) : null}
      <div className="mt-3 w-full">
        <GoogleSignInButton />
      </div>
    </div>
  )
}
