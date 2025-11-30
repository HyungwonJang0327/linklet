import { useState, useCallback } from 'react'

/**
 * Custom hook for managing form errors
 * Provides a consistent interface for error state management across forms
 */
export function useFormErrors() {
  const [errors, setErrors] = useState<Record<string, string>>({})

  /**
   * Set a single error for a field
   */
  const setError = useCallback((field: string, message: string) => {
    setErrors((prev) => ({
      ...prev,
      [field]: message,
    }))
  }, [])

  /**
   * Set multiple errors at once
   */
  const setMultipleErrors = useCallback((newErrors: Record<string, string>) => {
    setErrors(newErrors)
  }, [])

  /**
   * Clear a specific field error
   */
  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  /**
   * Clear all errors
   */
  const clearAllErrors = useCallback(() => {
    setErrors({})
  }, [])

  /**
   * Check if a specific field has an error
   */
  const hasError = useCallback(
    (field: string): boolean => {
      return field in errors
    },
    [errors]
  )

  /**
   * Get error message for a specific field
   */
  const getError = useCallback(
    (field: string): string | undefined => {
      return errors[field]
    },
    [errors]
  )

  /**
   * Check if there are any errors
   */
  const hasAnyErrors = useCallback((): boolean => {
    return Object.keys(errors).length > 0
  }, [errors])

  return {
    errors,
    setError,
    setMultipleErrors,
    clearError,
    clearAllErrors,
    hasError,
    getError,
    hasAnyErrors,
  }
}
