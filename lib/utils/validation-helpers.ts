/**
 * Common validation helper functions
 * Centralized validation logic to reduce duplication
 */

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  min?: number,
  max?: number,
  fieldName = 'Field'
): ValidationResult {
  const trimmed = value.trim()

  if (min !== undefined && trimmed.length < min) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${min} characters long`,
    }
  }

  if (max !== undefined && trimmed.length > max) {
    return {
      isValid: false,
      error: `${fieldName} must be ${max} characters or less`,
    }
  }

  return { isValid: true }
}

/**
 * Validate required field
 */
export function validateRequired(value: string, fieldName = 'Field'): ValidationResult {
  if (!value || !value.trim()) {
    return {
      isValid: false,
      error: `${fieldName} is required`,
    }
  }

  return { isValid: true }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address',
    }
  }

  return { isValid: true }
}

/**
 * Validate URL format
 */
export function validateUrlFormat(url: string): ValidationResult {
  try {
    const urlObj = new URL(url)

    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return {
        isValid: false,
        error: 'URL must use HTTP or HTTPS protocol',
      }
    }

    return { isValid: true }
  } catch {
    return {
      isValid: false,
      error: 'Please enter a valid URL',
    }
  }
}

/**
 * Combine multiple validation results
 */
export function combineValidations(...results: ValidationResult[]): ValidationResult {
  for (const result of results) {
    if (!result.isValid) {
      return result
    }
  }

  return { isValid: true }
}

/**
 * Validate form data with schema
 */
export function validateFormData<T extends Record<string, any>>(
  data: T,
  schema: {
    [K in keyof T]?: (value: T[K]) => ValidationResult
  }
): { isValid: boolean; errors: Partial<Record<keyof T, string>> } {
  const errors: Partial<Record<keyof T, string>> = {}

  for (const field in schema) {
    const validator = schema[field]
    if (validator) {
      const result = validator(data[field])
      if (!result.isValid && result.error) {
        errors[field] = result.error
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Sanitize string input
 */
export function sanitizeString(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

/**
 * Check if array has duplicates
 */
export function hasDuplicates<T>(array: T[]): boolean {
  return new Set(array).size !== array.length
}

/**
 * Find duplicate values in array
 */
export function findDuplicates<T>(array: T[]): T[] {
  const seen = new Set<T>()
  const duplicates = new Set<T>()

  for (const item of array) {
    if (seen.has(item)) {
      duplicates.add(item)
    } else {
      seen.add(item)
    }
  }

  return Array.from(duplicates)
}
