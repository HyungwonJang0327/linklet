import { isLocale, type Locale } from '../config'
import type { Dictionary } from '../types'

// 사전 로더 — decisions/i18n.md L6. 로케일별 동적 import() 라 클라이언트 번들에는 요청한 언어 하나만 들어간다
// 서버 컴포넌트: getDictionary(locale) → createT(dictionary). 클라이언트: layout 이 받은 사전을 I18nProvider 로 내려준다

const LOADERS: Readonly<Record<Locale, () => Promise<Dictionary>>> = {
  ko: () => import('./ko').then((m) => m.ko),
  en: () => import('./en').then((m) => m.en),
  ja: () => import('./ja').then((m) => m.ja),
}

/** 타입은 Locale 만 받는다. 외부 값은 호출 전에 isLocale 로 좁힌다 — 그래도 새면 개발자 실수이므로 throw */
export function getDictionary(locale: Locale): Promise<Dictionary> {
  if (!isLocale(locale)) throw new Error('getDictionary: unsupported locale')
  return LOADERS[locale]()
}
