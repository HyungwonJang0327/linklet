export const locales = ['kr', 'en', 'jp'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'kr'

export const localeNames = {
  en: 'English',
  kr: '한국어',
  jp: '日本語'
} as const