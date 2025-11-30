import { describe, it, expect } from 'vitest'
import {
  validateLength,
  validateRequired,
  validateEmail,
  validateUrlFormat,
  combineValidations,
  sanitizeString,
  hasDuplicates,
  findDuplicates,
} from '@/lib/utils/validation-helpers'

describe('validation-helpers', () => {
  describe('validateLength', () => {
    it('should validate minimum length', () => {
      const result = validateLength('ab', 3, undefined, 'Test')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Test must be at least 3 characters long')
    })

    it('should validate maximum length', () => {
      const result = validateLength('abcdefghijk', undefined, 10, 'Test')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Test must be 10 characters or less')
    })

    it('should pass for valid length', () => {
      const result = validateLength('hello', 2, 10)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should trim whitespace before checking length', () => {
      const result = validateLength('  abc  ', 3, 5)
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateRequired', () => {
    it('should fail for empty string', () => {
      const result = validateRequired('', 'Username')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Username is required')
    })

    it('should fail for whitespace only', () => {
      const result = validateRequired('   ', 'Email')
      expect(result.isValid).toBe(false)
    })

    it('should pass for non-empty string', () => {
      const result = validateRequired('test')
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      const result = validateEmail('test@example.com')
      expect(result.isValid).toBe(true)
    })

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid').isValid).toBe(false)
      expect(validateEmail('test@').isValid).toBe(false)
      expect(validateEmail('@example.com').isValid).toBe(false)
      expect(validateEmail('test@example').isValid).toBe(false)
    })
  })

  describe('validateUrlFormat', () => {
    it('should validate HTTP URLs', () => {
      const result = validateUrlFormat('http://example.com')
      expect(result.isValid).toBe(true)
    })

    it('should validate HTTPS URLs', () => {
      const result = validateUrlFormat('https://example.com/path')
      expect(result.isValid).toBe(true)
    })

    it('should reject non-HTTP(S) protocols', () => {
      const result = validateUrlFormat('ftp://example.com')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('URL must use HTTP or HTTPS protocol')
    })

    it('should reject invalid URLs', () => {
      const result = validateUrlFormat('not-a-url')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Please enter a valid URL')
    })
  })

  describe('combineValidations', () => {
    it('should pass if all validations pass', () => {
      const result = combineValidations(
        { isValid: true },
        { isValid: true },
        { isValid: true }
      )
      expect(result.isValid).toBe(true)
    })

    it('should fail and return first error', () => {
      const result = combineValidations(
        { isValid: true },
        { isValid: false, error: 'First error' },
        { isValid: false, error: 'Second error' }
      )
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('First error')
    })
  })

  describe('sanitizeString', () => {
    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello')
    })

    it('should replace multiple spaces with single space', () => {
      expect(sanitizeString('hello    world')).toBe('hello world')
    })

    it('should handle tabs and newlines', () => {
      expect(sanitizeString('hello\t\nworld')).toBe('hello world')
    })
  })

  describe('hasDuplicates', () => {
    it('should return false for unique array', () => {
      expect(hasDuplicates([1, 2, 3, 4])).toBe(false)
    })

    it('should return true for array with duplicates', () => {
      expect(hasDuplicates([1, 2, 2, 3])).toBe(true)
    })

    it('should work with strings', () => {
      expect(hasDuplicates(['a', 'b', 'c'])).toBe(false)
      expect(hasDuplicates(['a', 'b', 'a'])).toBe(true)
    })
  })

  describe('findDuplicates', () => {
    it('should return empty array for unique items', () => {
      expect(findDuplicates([1, 2, 3])).toEqual([])
    })

    it('should return duplicate values', () => {
      expect(findDuplicates([1, 2, 2, 3, 3, 3])).toEqual([2, 3])
    })

    it('should work with strings', () => {
      expect(findDuplicates(['a', 'b', 'a', 'c', 'b'])).toEqual(['a', 'b'])
    })
  })
})
