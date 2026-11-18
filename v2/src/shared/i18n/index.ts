// shared/i18n 공개 API — 기능 코드는 '@/shared/i18n' 으로만 import 한다 (decisions/i18n.md)
// 서버 컴포넌트: getDictionary(locale) → createT(dictionary). 클라이언트: I18nProvider + useT()/useLocale()

export { DEFAULT_LOCALE, isLocale, LOCALE_NAMES, LOCALES, type Locale } from './config'
export { negotiateLocale } from './negotiate'
export { getDictionary } from './dictionaries'
export { errorMessageKey, UNKNOWN_ERROR_KEY } from './keys'
export { createT } from './t'
export type { Dictionary, DictionaryKey, Params, T } from './types'
export { I18nProvider, useLocale, useT } from './client'
