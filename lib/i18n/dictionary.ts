import { type Locale } from './config'

const dictionaries = {
  en: () => import('./locales/en.json').then((module) => module.default),
  kr: () => import('./locales/kr.json').then((module) => module.default),
  jp: () => import('./locales/jp.json').then((module) => module.default)
}

export const getDictionary = async (locale: Locale) => {
  return dictionaries[locale]?.() ?? dictionaries.kr()
}

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>