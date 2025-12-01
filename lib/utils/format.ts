/**
 * Format a number with thousands separators
 * @param value - Number or string to format
 * @param locale - Locale string (default: 'ko-KR' for Korean format)
 * @returns Formatted number string
 */
export function formatNumber(value: number | string | null | undefined, locale: string = 'ko-KR'): string {
  if (value === null || value === undefined || value === '') return ''

  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value

  if (isNaN(num)) return ''

  return num.toLocaleString(locale)
}

/**
 * Parse a formatted number string to a plain number string
 * @param value - Formatted number string
 * @returns Plain number string without commas
 */
export function parseFormattedNumber(value: string): string {
  return value.replace(/,/g, '')
}

/**
 * Format price with currency symbol
 * @param price - Price value
 * @param currency - Currency symbol (default: '원')
 * @param locale - Locale string
 * @returns Formatted price string
 */
export function formatPrice(price: number | string | null | undefined, currency: string = '원', locale: string = 'ko-KR'): string {
  const formatted = formatNumber(price, locale)
  return formatted ? `${formatted}${currency}` : ''
}

/**
 * Handle number input - only allows digits and commas
 * @param value - Input value
 * @returns Sanitized value with only digits
 */
export function sanitizeNumberInput(value: string): string {
  // Remove all non-digit characters
  return value.replace(/[^\d]/g, '')
}

/**
 * Format number input as user types
 * @param value - Input value
 * @param locale - Locale string
 * @returns Formatted value
 */
export function formatNumberInput(value: string, locale: string = 'ko-KR'): string {
  const sanitized = sanitizeNumberInput(value)
  if (!sanitized) return ''

  const num = parseInt(sanitized, 10)
  return formatNumber(num, locale)
}
