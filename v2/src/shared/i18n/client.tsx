'use client'

import { createContext, type PropsWithChildren, useContext, useMemo } from 'react'

import type { Locale } from './config'
import { createT } from './t'
import type { Dictionary, T } from './types'

// 클라이언트 i18n — decisions/i18n.md L6. [locale] layout(F03) 이 서버에서 getDictionary 로 읽은 사전을 내려주고,
// 클라이언트 컴포넌트는 useT()·useLocale() 로 쓴다. t() 는 서버와 같은 createT.
// 이 파일은 아직 어디에도 마운트하지 않는다 — F03 에서 layout 이 꽂는다

type I18nContextValue = { readonly locale: Locale; readonly t: T }

const I18nContext = createContext<I18nContextValue | null>(null)

type I18nProviderProps = PropsWithChildren<{ locale: Locale; dictionary: Dictionary }>

export function I18nProvider({ locale, dictionary, children }: I18nProviderProps) {
  const value = useMemo<I18nContextValue>(
    () => ({ locale, t: createT(dictionary) }),
    [locale, dictionary],
  )
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

function useI18nContext(hook: string): I18nContextValue {
  const value = useContext(I18nContext)
  // Provider 밖 호출은 개발자 실수 — 키 문자열이 조용히 노출되는 대신 즉시 알린다
  if (value === null) throw new Error(`${hook} must be used within <I18nProvider>`)
  return value
}

/** 현재 언어의 t() */
export function useT(): T {
  return useI18nContext('useT').t
}

/** 현재 언어 코드 */
export function useLocale(): Locale {
  return useI18nContext('useLocale').locale
}
