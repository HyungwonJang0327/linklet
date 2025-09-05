'use client'

import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { ProductMetadata } from '@/lib/services/url-metadata'

interface MetadataResult {
  success: boolean
  data?: ProductMetadata
  error?: string
}

interface UseUrlMetadataResult {
  extractMetadata: (url: string) => Promise<MetadataResult>
  isLoading: boolean
  error: string | null
}

/**
 * Hook for extracting metadata from URLs
 */
export function useUrlMetadata(): UseUrlMetadataResult {
  const [error, setError] = useState<string | null>(null)

  const metadataMutation = useMutation({
    mutationFn: async (url: string): Promise<MetadataResult> => {
      setError(null)

      if (!url?.trim()) {
        throw new Error('URL is required')
      }

      try {
        const response = await fetch('/api/metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: url.trim() }),
        })

        if (!response) {
          throw new Error('No response received')
        }

        const result = await response.json().catch(() => ({ error: 'Invalid response format' }))

        if (!response.ok) {
          throw new Error(result?.error || `HTTP ${response.status}: ${response.statusText}`)
        }

        return result ?? { success: false, error: 'Empty response' }
      } catch (error) {
        if (error instanceof Error) {
          throw error
        }
        throw new Error('Network error occurred')
      }
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract metadata'
      setError(errorMessage)
    },
  })

  const extractMetadata = useCallback(
    async (url: string): Promise<MetadataResult> => {
      try {
        const result = await metadataMutation.mutateAsync(url)
        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to extract metadata'
        return {
          success: false,
          error: errorMessage,
        }
      }
    },
    [metadataMutation]
  )

  return {
    extractMetadata,
    isLoading: metadataMutation.isPending,
    error,
  }
}

/**
 * Hook for batch metadata extraction
 */
export function useBatchUrlMetadata() {
  const [results, setResults] = useState<Map<string, MetadataResult>>(new Map())
  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set())
  const { extractMetadata } = useUrlMetadata()

  const extractBatchMetadata = useCallback(
    async (urls: string[]) => {
      if (!urls?.length) {
        return []
      }

      const validUrls = urls
        .filter(url => url?.trim())
        .filter(url => {
          try {
            new URL(url.trim())
            return true
          } catch {
            return false
          }
        })

      if (validUrls.length === 0) {
        return []
      }

      setLoadingUrls(prev => new Set([...(prev ?? new Set()), ...validUrls]))

      const promises = validUrls.map(async (url) => {
        try {
          const result = await extractMetadata(url)
          setResults(prev => {
            const currentMap = prev ?? new Map()
            return new Map(currentMap.set(url, result))
          })
          return { url, result }
        } catch (err) {
          const errorResult: MetadataResult = {
            success: false,
            error: err instanceof Error ? err.message : 'Failed to extract metadata',
          }
          setResults(prev => {
            const currentMap = prev ?? new Map()
            return new Map(currentMap.set(url, errorResult))
          })
          return { url, result: errorResult }
        } finally {
          setLoadingUrls(prev => {
            const current = prev ?? new Set()
            const next = new Set(current)
            next.delete(url)
            return next
          })
        }
      })

      return await Promise.all(promises)
    },
    [extractMetadata]
  )

  const getMetadataForUrl = useCallback(
    (url: string): MetadataResult | undefined => {
      if (!url?.trim() || !results) {
        return undefined
      }
      return results.get(url.trim())
    },
    [results]
  )

  const isUrlLoading = useCallback(
    (url: string): boolean => {
      if (!url?.trim() || !loadingUrls) {
        return false
      }
      return loadingUrls.has(url.trim())
    },
    [loadingUrls]
  )

  const clearResults = useCallback(() => {
    setResults(new Map())
  }, [])

  return {
    extractBatchMetadata,
    getMetadataForUrl,
    isUrlLoading,
    results: results,
    clearResults,
  }
}