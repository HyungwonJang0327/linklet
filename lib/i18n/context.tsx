'use client'

import { createContext, useContext, ReactNode } from 'react'
import { type Locale } from './config'
import { type Dictionary } from './dictionary'

interface I18nContextType {
  locale: Locale
  dictionary: Dictionary
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

interface I18nProviderProps {
  locale: Locale
  dictionary: Dictionary
  children: ReactNode
}

export function I18nProvider({ locale, dictionary, children }: I18nProviderProps) {
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.')
    let value: any = dictionary
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    if (typeof value !== 'string') {
      console.warn(`Translation key "${key}" not found`)
      return key
    }
    
    // Simple parameter replacement
    if (params) {
      return Object.entries(params).reduce(
        (str, [paramKey, paramValue]) => 
          str.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue)),
        value
      )
    }
    
    return value
  }

  const contextValue: I18nContextType = {
    locale,
    dictionary,
    t
  }

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}