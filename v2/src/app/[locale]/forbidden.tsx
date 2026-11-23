import { locale as rootLocale } from 'next/root-params'

import { createT, DEFAULT_LOCALE, getDictionary, isLocale } from '@/shared/i18n'
import { EMPTY_STATE_ACTION_CLASS, EmptyState } from '@/shared/ui/empty-state'

// [locale] 구간 403 — FEATURES F09·F33. admin layout 이 forbidden() 을 부르면 Next 가 403 상태로 이 화면을 그린다
// (experimental.authInterrupts, forbidden.md). 로그인은 했지만 권한이 없는 경우라 로그인 버튼은 없다 — 홈으로 돌아가는 링크 하나.
// 버튼 문구는 notFound.home 재사용(키 중복 금지). props 없음(forbidden.md "Props"), locale 은 next/root-params.
export default async function LocaleForbidden() {
  const raw = await rootLocale()
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE
  const t = createT(await getDictionary(locale))

  return (
    <EmptyState
      title={t('forbidden.title')}
      description={t('forbidden.description')}
      action={
        <a href={`/${locale}`} className={EMPTY_STATE_ACTION_CLASS}>
          {t('notFound.home')}
        </a>
      }
    />
  )
}
