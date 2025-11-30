import { useState, useCallback } from 'react'
import { useBatchUrlMetadata } from './use-url-metadata'
import type { ProductMetadata } from '@/lib/services/url-metadata'

interface UseProductMetadataManagerOptions {
  productLinks: string[]
  isValidUrl: (url: string) => boolean
  onMetadataExtracted?: (index: number, metadata: ProductMetadata) => void
}

interface UseProductMetadataManagerReturn {
  extractedCount: number
  extractionAttempted: Record<string, boolean>
  handleExtractMetadata: (url: string) => Promise<void>
  handleBulkExtract: () => Promise<void>
  getMetadataForUrl: ReturnType<typeof useBatchUrlMetadata>['getMetadataForUrl']
  isUrlLoading: (url: string) => boolean
}

/**
 * Custom hook to manage product metadata extraction and state
 * Encapsulates all metadata extraction logic for product links
 */
export function useProductMetadataManager({
  productLinks,
  isValidUrl,
  onMetadataExtracted,
}: UseProductMetadataManagerOptions): UseProductMetadataManagerReturn {
  const { extractBatchMetadata, getMetadataForUrl, isUrlLoading } = useBatchUrlMetadata()
  const [extractedCount, setExtractedCount] = useState(0)
  const [extractionAttempted, setExtractionAttempted] = useState<Record<string, boolean>>({})

  const handleExtractMetadata = useCallback(
    async (url: string) => {
      if (!url?.trim()) {
        console.error('Invalid URL provided for metadata extraction')
        return
      }

      const trimmedUrl = url.trim()

      // Mark extraction as attempted for this URL
      setExtractionAttempted((prev) => ({
        ...prev,
        [trimmedUrl]: true,
      }))

      try {
        const results = await extractBatchMetadata([trimmedUrl])
        const result = results?.[0]
        if (result?.result?.success && result.result?.data && onMetadataExtracted) {
          const index = productLinks?.findIndex((link) => link?.trim() === trimmedUrl) ?? -1
          if (index !== -1) {
            onMetadataExtracted(index, result.result.data)
          }
        }
        setExtractedCount((prev) => (prev ?? 0) + 1)
      } catch (error) {
        console.error('Failed to extract metadata:', error)
      }
    },
    [extractBatchMetadata, onMetadataExtracted, productLinks]
  )

  const handleBulkExtract = useCallback(async () => {
    if (!productLinks?.length) return

    const validLinks = productLinks
      .filter((link) => link?.trim())
      .filter((link) => isValidUrl(link.trim()))

    if (validLinks.length === 0) return

    try {
      const results = await extractBatchMetadata(validLinks.map((link) => link.trim()))
      if (Array.isArray(results)) {
        results.forEach(({ url, result }) => {
          if (result?.success && result?.data && onMetadataExtracted) {
            const index = productLinks.findIndex((link) => link?.trim() === url?.trim())
            if (index !== -1) {
              onMetadataExtracted(index, result.data)
            }
          }
        })
        setExtractedCount(results.length)
      }
    } catch (error) {
      console.error('Failed to extract metadata:', error)
    }
  }, [productLinks, isValidUrl, extractBatchMetadata, onMetadataExtracted])

  return {
    extractedCount,
    extractionAttempted,
    handleExtractMetadata,
    handleBulkExtract,
    getMetadataForUrl,
    isUrlLoading,
  }
}
