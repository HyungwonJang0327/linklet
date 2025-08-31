import { type Locale } from './config'

const dictionaries = {
  en: () => import('./locales/en.json').then((module) => module.default),
  ko: () => import('./locales/ko.json').then((module) => module.default),
  ja: () => import('./locales/ja.json').then((module) => module.default)
}

export const getDictionary = async (locale: Locale) => {
  return dictionaries[locale]?.() ?? dictionaries.ko()
}

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>