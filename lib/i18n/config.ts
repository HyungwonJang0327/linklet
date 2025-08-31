export const locales = ['ko', 'en', 'ja'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'ko'

export const localeNames = {
  en: 'English',
  ko: '한국어',
  ja: '日本語'
} as const