'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useUrlMetadata } from './use-url-metadata'
import type { ProductMetadata } from '@/lib/services/url-metadata'

interface UseAutoMetadataExtractionOptions {
  debouncedUrl: string
  isValidUrl: (url: string) => boolean
  metadata?: ProductMetadata
  isGloballyRateLimited?: boolean
  onRateLimitDetected?: () => void
  onMetadataExtracted?: (metadata: ProductMetadata) => void
  index?: number
}

export function useAutoMetadataExtraction({
  debouncedUrl,
  isValidUrl,
  metadata,
  isGloballyRateLimited,
  onRateLimitDetected,
  onMetadataExtracted,
  index = 0
}: UseAutoMetadataExtractionOptions) {
  const [autoMetadata, setAutoMetadata] = useState<ProductMetadata | null>(null)
  const [extractionFailed, setExtractionFailed] = useState(false)
  const [hasCalledCallback, setHasCalledCallback] = useState(false)

  const failedUrlsRef = useRef<Map<string, number>>(new Map())
  const currentRequestUrlRef = useRef<string>('')
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousUrlRef = useRef<string>('')

  const { extractMetadata, isLoading: isFetchingMetadata } = useUrlMetadata()
  const extractMetadataRef = useRef(extractMetadata)

  // Update ref when extractMetadata changes
  useEffect(() => {
    extractMetadataRef.current = extractMetadata
  }, [extractMetadata])

  // Check if URL can be retried (5 minutes timeout for failed URLs)
  const canRetryUrl = useCallback((url: string): boolean => {
    const failedTime = failedUrlsRef.current.get(url)

    if (!failedTime) {
      return true
    }

    const now = Date.now()
    const fiveMinutes = 5 * 60 * 1000

    if (now - failedTime > fiveMinutes) {
      failedUrlsRef.current.delete(url)
      return true
    }

    return false
  }, [])

  const currentUrlFailed = debouncedUrl?.trim() ? !canRetryUrl(debouncedUrl.trim()) : false

  // Reset states when URL changes
  useEffect(() => {
    const currentUrl = debouncedUrl?.trim() || ''
    const previousUrl = previousUrlRef.current

    if (currentUrl !== previousUrl) {
      setHasCalledCallback(false)
      setExtractionFailed(false)
      setAutoMetadata(null)

      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current)
        fallbackTimeoutRef.current = null
      }

      previousUrlRef.current = currentUrl
    }
  }, [debouncedUrl])

  // Automatic metadata fetching
  useEffect(() => {
    const trimmedUrl = debouncedUrl?.trim()

    const fetchMetadata = async () => {
      if (trimmedUrl && isValidUrl(trimmedUrl) && !metadata && !autoMetadata) {
        if (!canRetryUrl(trimmedUrl) || isGloballyRateLimited) {
          setExtractionFailed(true)
          return
        }

        currentRequestUrlRef.current = trimmedUrl

        try {
          const result = await extractMetadataRef.current(trimmedUrl)

          // Race condition check
          if (currentRequestUrlRef.current !== trimmedUrl) {
            return
          }

          if (result.success && result.data) {
            setAutoMetadata(result.data)
            setExtractionFailed(false)
            failedUrlsRef.current.delete(trimmedUrl)
          } else {
            setAutoMetadata(null)

            if (result.error?.includes('Rate limit') || result.error?.includes('429')) {
              onRateLimitDetected?.()
            } else {
              failedUrlsRef.current.set(trimmedUrl, Date.now())
              setExtractionFailed(true)
            }
          }
        } catch (error) {
          if (currentRequestUrlRef.current !== trimmedUrl) {
            return
          }

          setAutoMetadata(null)
          failedUrlsRef.current.set(trimmedUrl, Date.now())
          setExtractionFailed(true)
        }
      }
    }

    fetchMetadata()

    // Fallback timeout
    if (trimmedUrl && isValidUrl(trimmedUrl) && !metadata && !autoMetadata && canRetryUrl(trimmedUrl) && !isGloballyRateLimited) {
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current)
      }

      fallbackTimeoutRef.current = setTimeout(() => {
        if (!autoMetadata && !metadata) {
          setExtractionFailed(true)
          failedUrlsRef.current.set(trimmedUrl, Date.now())
        }
      }, 12000)
    } else {
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current)
        fallbackTimeoutRef.current = null
      }
    }
  }, [debouncedUrl, isValidUrl, metadata, autoMetadata, isGloballyRateLimited, onRateLimitDetected, canRetryUrl])

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current)
      }
    }
  }, [])

  // Call parent callback when metadata is extracted
  useEffect(() => {
    if (autoMetadata && onMetadataExtracted && !hasCalledCallback) {
      onMetadataExtracted(autoMetadata)
      setHasCalledCallback(true)
    }
  }, [autoMetadata, onMetadataExtracted, hasCalledCallback])

  return {
    autoMetadata,
    extractionFailed,
    isFetchingMetadata,
    currentUrlFailed,
    canRetryUrl
  }
}
