import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Class utility for conditional classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export date utilities from date.ts
export { formatDate, formatRelativeTime, formatFullDate, isValidDate } from './date'

// Price formatter
export function formatPrice(
  price: string | null,
  locale: string = 'kr',
  options?: {
    notAvailableText?: string
    currency?: string
  }
): string {
  const notAvailable = options?.notAvailableText || (locale === 'en' ? 'Price not available' : locale === 'jp' ? '価格情報なし' : '가격 정보 없음')
  const currency = options?.currency || (locale === 'en' ? '$' : locale === 'jp' ? '¥' : '원')

  if (!price) return notAvailable

  // Remove non-numeric characters except for dots and commas
  const numericPrice = price.replace(/[^\d.,]/g, '')
  const numberValue = parseFloat(numericPrice.replace(/,/g, ''))

  if (isNaN(numberValue)) return price

  const localeMap: Record<string, string> = {
    'kr': 'ko-KR',
    'en': 'en-US',
    'jp': 'ja-JP'
  }

  return numberValue.toLocaleString(localeMap[locale] || 'ko-KR') + currency
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

// Re-export validation helpers
export {
  validateLength,
  validateRequired,
  validateEmail,
  validateUrlFormat,
  combineValidations,
  validateFormData,
  sanitizeString,
  hasDuplicates,
  findDuplicates,
  type ValidationResult,
} from './validation-helpers'

// Re-export API helpers
export {
  safeJsonParse,
  handleApiError,
  createErrorResponse,
  createSuccessResponse,
  fetchJson,
  postJson,
  putJson,
  deleteJson,
  type ApiResponse,
} from './api-helpers'

