import { type Locale, locales, defaultLocale } from './config'

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}

export function getLocaleFromPath(pathname: string): Locale {
  const segments = pathname.split('/')
  const localeSegment = segments[1]
  
  if (isValidLocale(localeSegment)) {
    return localeSegment
  }
  
  return defaultLocale
}

export function removeLocaleFromPath(pathname: string): string {
  const segments = pathname.split('/')
  const localeSegment = segments[1]
  
  if (isValidLocale(localeSegment)) {
    return '/' + segments.slice(2).join('/')
  }
  
  return pathname
}

export function addLocaleToPath(pathname: string, locale: Locale): string {
  if (locale === defaultLocale) {
    return pathname
  }
  
  const cleanPath = removeLocaleFromPath(pathname)
  return `/${locale}${cleanPath}`
}