import { locale as rootLocale } from 'next/root-params'

import { createT, DEFAULT_LOCALE, getDictionary, isLocale } from '@/shared/i18n'
import { EMPTY_STATE_ACTION_CLASS, EmptyState } from '@/shared/ui/empty-state'

// [locale] 구간 404 — FEATURES F06, error-handling E4. root layout 안에서 그려지므로 Topbar·토큰·<html lang> 이 그대로 적용된다.
// 대상: /{locale}/없는-경로 와 하위 세그먼트의 notFound(). root 밖 경로(/xx·/foo)는 app/global-not-found.tsx.
// not-found 는 props 를 받지 않는다(not-found.md "Props") — locale 은 next/root-params 의 getter 로 읽는다(Server Component 전용).
// dynamicParams=false 라 isLocale 이 아닌 값은 여기까지 오지 않지만, 타입이 string 이라 DEFAULT_LOCALE 로 안전하게 좁힌다.

export default async function LocaleNotFound() {
  const raw = await rootLocale()
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE
  const t = createT(await getDictionary(locale))

  return (
    <EmptyState
      title={t('notFound.title')}
      description={t('notFound.description')}
      action={
        // 전체 로드 <a> — Topbar 워드마크와 같은 이유(다중 root layout, F13 에서 Link 전환 검토)
        <a href={`/${locale}`} className={EMPTY_STATE_ACTION_CLASS}>
          {t('notFound.home')}
        </a>
      }
    />
  )
}
