import { describe, it, expect } from 'vitest'
import { cn, formatPrice, formatRelativeTime, isValidUrl, debounce } from '@/lib/utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      const result = cn('bg-red-500', 'text-white')
      expect(result).toContain('bg-red-500')
      expect(result).toContain('text-white')
    })

    it('should handle conditional classes', () => {
      const result = cn('base-class', false && 'hidden', 'visible')
      expect(result).toContain('base-class')
      expect(result).toContain('visible')
      expect(result).not.toContain('hidden')
    })

    it('should merge tailwind classes correctly', () => {
      const result = cn('bg-red-500', 'bg-blue-500')
      // tailwind-merge should keep only the last bg color
      expect(result).toBe('bg-blue-500')
    })
  })

  describe('formatPrice', () => {
    it('should format Korean won', () => {
      expect(formatPrice('10000')).toBe('10,000원')
      expect(formatPrice('1000000')).toBe('1,000,000원')
    })

    it('should handle prices with commas', () => {
      expect(formatPrice('1,000')).toBe('1,000원')
    })

    it('should handle null prices', () => {
      expect(formatPrice(null)).toBe('가격 정보 없음')
    })

    it('should handle prices with currency symbols', () => {
      expect(formatPrice('$100')).toBe('100원')
    })

    it('should handle invalid prices', () => {
      const result = formatPrice('invalid')
      expect(result).toBe('invalid')
    })
  })

  describe('formatRelativeTime', () => {
    it('should format recent times', () => {
      const now = new Date()
      expect(formatRelativeTime(now)).toBe('1분 미만 전')
    })

    it('should format minutes ago', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      expect(formatRelativeTime(date)).toBe('5분 전')
    })

    it('should format hours ago', () => {
      const date = new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
      expect(formatRelativeTime(date)).toBe('약 3시간 전')
    })

    it('should format days ago', () => {
      const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      expect(formatRelativeTime(date)).toBe('2일 전')
    })

    it('should handle string dates', () => {
      const date = new Date(Date.now() - 10 * 60 * 1000).toISOString()
      expect(formatRelativeTime(date)).toBe('10분 전')
    })
  })

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('http://example.com/path')).toBe(true)
      expect(isValidUrl('https://sub.example.com')).toBe(true)
    })

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false)
      expect(isValidUrl('just text')).toBe(false)
      expect(isValidUrl('')).toBe(false)
      expect(isValidUrl('//no-protocol')).toBe(false)
    })
  })

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      let callCount = 0
      const fn = () => { callCount++ }
      const debouncedFn = debounce(fn, 100)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      expect(callCount).toBe(0)

      await new Promise(resolve => setTimeout(resolve, 150))
      expect(callCount).toBe(1)
    })

    it('should pass arguments correctly', async () => {
      let result = ''
      const fn = (str: string) => { result = str }
      const debouncedFn = debounce(fn, 50)

      debouncedFn('test')
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(result).toBe('test')
    })
  })
})
