// 언어 상수 — decisions/i18n.md L1, url-design.md U3
// 서버·클라이언트 공용(server-only 없음). Prisma `Locale` enum 과 값이 같다(data-model.md).

export const LOCALES = ['ko', 'en', 'ja'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'ko'

/** 각 언어의 자기 표기 — 언어 선택 UI 에서 번역하지 않고 그대로 보여준다 */
export const LOCALE_NAMES: Readonly<Record<Locale, string>> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
}

/** URL 세그먼트·쿠키·Accept-Language 등 외부에서 온 값을 Locale 로 좁힌다 */
export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}
