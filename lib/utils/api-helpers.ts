/**
 * API utility functions for consistent error handling and response processing
 */

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  statusCode?: number
}

/**
 * Safely parse JSON response with error handling
 */
export async function safeJsonParse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Request failed',
        statusCode: response.status,
      }
    }

    return {
      success: true,
      data,
      statusCode: response.status,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse response',
      statusCode: response.status,
    }
  }
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }

  return 'An unexpected error occurred'
}

/**
 * Create API error response
 */
export function createErrorResponse(message: string, statusCode = 400): ApiResponse<never> {
  return {
    success: false,
    error: message,
    statusCode,
  }
}

/**
 * Create API success response
 */
export function createSuccessResponse<T>(data: T, statusCode = 200): ApiResponse<T> {
  return {
    success: true,
    data,
    statusCode,
  }
}

/**
 * Fetch with automatic error handling and JSON parsing
 */
export async function fetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    return await safeJsonParse<T>(response)
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
    }
  }
}

/**
 * POST request helper
 */
export async function postJson<T, D = unknown>(
  url: string,
  data: D,
  options?: Omit<RequestInit, 'method' | 'body'>
): Promise<ApiResponse<T>> {
  return fetchJson<T>(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * PUT request helper
 */
export async function putJson<T, D = unknown>(
  url: string,
  data: D,
  options?: Omit<RequestInit, 'method' | 'body'>
): Promise<ApiResponse<T>> {
  return fetchJson<T>(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * DELETE request helper
 */
export async function deleteJson<T>(
  url: string,
  options?: Omit<RequestInit, 'method'>
): Promise<ApiResponse<T>> {
  return fetchJson<T>(url, {
    ...options,
    method: 'DELETE',
  })
}
