import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Class utility for conditional classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date utility
export function formatDate(date: Date | string, locale: string = 'kr'): string {
  if (locale === 'kr') {
    locale = 'ko-KR'
  } else if (locale === 'jp') {
    locale = 'ja-JP'
  } else if (locale === 'en') {
    locale = 'en-US'
  } else {
    locale = 'ko-KR'
  }
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Format relative time
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - dateObj.getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}일 전`
  if (hours > 0) return `${hours}시간 전`
  if (minutes > 0) return `${minutes}분 전`
  return '방금 전'
}

// Price formatter
export function formatPrice(price: string | null): string {
  if (!price) return '가격 정보 없음'

  // Remove non-numeric characters except for dots and commas
  const numericPrice = price.replace(/[^\d.,]/g, '')
  const numberValue = parseFloat(numericPrice.replace(/,/g, ''))

  if (isNaN(numberValue)) return price

  return numberValue.toLocaleString('ko-KR') + '원'
}

// URL validation
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Generate share URL
export function generateShareUrl(shareId: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/w/${shareId}`
  }
  return `/w/${shareId}`
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textArea)
    return success
  }
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Local storage helpers
export const storage = {
  get: (key: string) => {
    if (typeof window === 'undefined') return null
    try {
      return JSON.parse(localStorage.getItem(key) || 'null')
    } catch {
      return null
    }
  },

  set: (key: string, value: any) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Handle storage errors silently
    }
  },

  remove: (key: string) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(key)
    } catch {
      // Handle storage errors silently
    }
  }
}

// Guest wishlist management
export const guestWishlists = {
  get: (): string[] => {
    return storage.get('guestWishlists') || []
  },

  add: (wishlistId: string) => {
    const current = guestWishlists.get()
    if (!current.includes(wishlistId)) {
      storage.set('guestWishlists', [...current, wishlistId])
    }
  },

  remove: (wishlistId: string) => {
    const current = guestWishlists.get()
    storage.set('guestWishlists', current.filter(id => id !== wishlistId))
  },

  clear: () => {
    storage.remove('guestWishlists')
  }
}