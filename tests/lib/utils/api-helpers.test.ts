import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  handleApiError,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/utils/api-helpers'

describe('api-helpers', () => {
  describe('handleApiError', () => {
    it('should handle Error objects', () => {
      const error = new Error('Test error')
      expect(handleApiError(error)).toBe('Test error')
    })

    it('should handle string errors', () => {
      expect(handleApiError('String error')).toBe('String error')
    })

    it('should handle objects with message property', () => {
      const error = { message: 'Object error' }
      expect(handleApiError(error)).toBe('Object error')
    })

    it('should handle unknown errors', () => {
      expect(handleApiError(null)).toBe('An unexpected error occurred')
      expect(handleApiError(undefined)).toBe('An unexpected error occurred')
      expect(handleApiError(123)).toBe('An unexpected error occurred')
    })
  })

  describe('createErrorResponse', () => {
    it('should create error response with default status', () => {
      const response = createErrorResponse('Error message')
      expect(response).toEqual({
        success: false,
        error: 'Error message',
        statusCode: 400,
      })
    })

    it('should create error response with custom status', () => {
      const response = createErrorResponse('Not found', 404)
      expect(response).toEqual({
        success: false,
        error: 'Not found',
        statusCode: 404,
      })
    })
  })

  describe('createSuccessResponse', () => {
    it('should create success response with default status', () => {
      const data = { id: 1, name: 'Test' }
      const response = createSuccessResponse(data)
      expect(response).toEqual({
        success: true,
        data,
        statusCode: 200,
      })
    })

    it('should create success response with custom status', () => {
      const data = { created: true }
      const response = createSuccessResponse(data, 201)
      expect(response).toEqual({
        success: true,
        data,
        statusCode: 201,
      })
    })
  })
})
