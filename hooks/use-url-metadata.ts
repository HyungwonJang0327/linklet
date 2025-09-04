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

      const response = await fetch('/api/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to extract metadata')
      }

      return result
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
      const validUrls = urls.filter(url => {
        try {
          new URL(url)
          return true
        } catch {
          return false
        }
      })

      setLoadingUrls(prev => new Set([...prev, ...validUrls]))

      const promises = validUrls.map(async (url) => {
        try {
          const result = await extractMetadata(url)
          setResults(prev => new Map(prev.set(url, result)))
          return { url, result }
        } catch (err) {
          const errorResult: MetadataResult = {
            success: false,
            error: err instanceof Error ? err.message : 'Failed to extract metadata',
          }
          setResults(prev => new Map(prev.set(url, errorResult)))
          return { url, result: errorResult }
        } finally {
          setLoadingUrls(prev => {
            const next = new Set(prev)
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
      return results.get(url)
    },
    [results]
  )

  const isUrlLoading = useCallback(
    (url: string): boolean => {
      return loadingUrls.has(url)
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