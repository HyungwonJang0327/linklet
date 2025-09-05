/**
 * Validation utilities with defensive programming patterns
 */

// URL validation
export function isValidUrl(url: unknown): url is string {
  if (typeof url !== 'string' || !url?.trim()) {
    return false
  }
  
  try {
    const parsed = new URL(url.trim())
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// Email validation
export function isValidEmail(email: unknown): email is string {
  if (typeof email !== 'string' || !email?.trim()) {
    return false
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

// String validation
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function isValidStringLength(value: unknown, minLength = 0, maxLength = Infinity): value is string {
  if (!isNonEmptyString(value)) {
    return minLength === 0
  }
  
  const length = value.trim().length
  return length >= minLength && length <= maxLength
}

// Number validation
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value)
}

export function isPositiveInteger(value: unknown): value is number {
  return isValidNumber(value) && value > 0 && Number.isInteger(value)
}

// Object validation
export function isNonNullObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function hasRequiredFields<T extends Record<string, unknown>>(
  obj: unknown,
  requiredFields: (keyof T)[]
): obj is T {
  if (!isNonNullObject(obj)) {
    return false
  }
  
  return requiredFields.every(field => 
    field in obj && obj[field] !== null && obj[field] !== undefined
  )
}

// Array validation
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0
}

// Sanitization utilities
export function sanitizeString(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }
  
  return value
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/[<>]/g, '') // Remove potential HTML tags
}

export function sanitizeUrl(url: unknown): string | null {
  if (!isValidUrl(url)) {
    return null
  }
  
  try {
    const parsed = new URL(url.trim())
    // Only allow http and https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    
    return parsed.href
  } catch {
    return null
  }
}

// Safe parsers
export function safeParseInt(value: unknown, fallback = 0): number {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : fallback
  }
  
  if (typeof value === 'string') {
    const parsed = parseInt(value.trim(), 10)
    return isNaN(parsed) ? fallback : parsed
  }
  
  return fallback
}

export function safeParseFloat(value: unknown, fallback = 0): number {
  if (typeof value === 'number') {
    return isFinite(value) ? value : fallback
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value.trim())
    return isNaN(parsed) ? fallback : parsed
  }
  
  return fallback
}

export function safeParseJSON<T = unknown>(jsonString: unknown, fallback: T): T {
  if (typeof jsonString !== 'string' || !jsonString.trim()) {
    return fallback
  }
  
  try {
    return JSON.parse(jsonString.trim()) ?? fallback
  } catch {
    return fallback
  }
}

// Type guards
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number'
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

// Error handling
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  if (isNonNullObject(error) && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  
  return 'An unknown error occurred'
}

export function isErrorLike(value: unknown): value is { message: string } {
  return isNonNullObject(value) && 'message' in value && typeof value.message === 'string'
}