import { format, formatDistanceToNow, isToday, isYesterday, isThisYear } from 'date-fns'
import { ko, enUS, ja } from 'date-fns/locale'

const locales = {
  kr: ko,
  en: enUS,
  jp: ja
}

export function formatDate(date: Date | string, locale: 'kr' | 'en' | 'jp' = 'kr'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const dateFnsLocale = locales[locale]
  
  if (isToday(dateObj)) {
    return format(dateObj, 'HH:mm', { locale: dateFnsLocale })
  }
  
  if (isYesterday(dateObj)) {
    const yesterday = {
      kr: '어제',
      en: 'Yesterday',
      jp: '昨日'
    }
    return `${yesterday[locale]} ${format(dateObj, 'HH:mm', { locale: dateFnsLocale })}`
  }
  
  if (isThisYear(dateObj)) {
    return format(dateObj, 'MMM d', { locale: dateFnsLocale })
  }
  
  return format(dateObj, 'yyyy MMM d', { locale: dateFnsLocale })
}

export function formatRelativeTime(date: Date | string, locale: 'kr' | 'en' | 'jp' = 'kr'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const dateFnsLocale = locales[locale]
  
  return formatDistanceToNow(dateObj, { 
    addSuffix: true, 
    locale: dateFnsLocale 
  })
}

export function formatFullDate(date: Date | string, locale: 'kr' | 'en' | 'jp' = 'kr'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const dateFnsLocale = locales[locale]
  
  return format(dateObj, 'yyyy년 MMM d일 HH:mm', { locale: dateFnsLocale })
}

export function isValidDate(date: any): date is Date {
  return date instanceof Date && !isNaN(date.getTime())
}