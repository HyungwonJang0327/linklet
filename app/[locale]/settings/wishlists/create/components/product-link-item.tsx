'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ImageUpload from '@/components/ui/image-upload'
import { TrashIcon, SparklesIcon, PhotoIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'
import useDebounce from '@/hooks/use-debounce'
import { useUrlMetadata } from '@/hooks/use-url-metadata'
import type { ProductMetadata } from '@/lib/services/url-metadata'
import Image from 'next/image'

interface ProductLinkItemProps {
  index: number
  link: string
  error?: string
  loading: boolean
  isValidUrl: (string: string) => boolean
  onUpdate: (index: number, value: string) => void
  onRemove: (index: number) => void
  onExtractMetadata: (url: string) => void
  metadata?: ProductMetadata
  isExtracting?: boolean
  onMetadataManualUpdate?: (index: number, metadata: Partial<ProductMetadata>) => void
  extractionAttempted?: boolean
}

export default function ProductLinkItem({
  index,
  link,
  error,
  loading,
  isValidUrl,
  onUpdate,
  onRemove,
  onExtractMetadata,
  metadata,
  isExtracting,
  onMetadataManualUpdate,
  extractionAttempted
}: ProductLinkItemProps) {
  const { t } = useI18n()
  const [isEditingMetadata, setIsEditingMetadata] = useState(false)
  const [extractionFailed, setExtractionFailed] = useState(false)
  const [showManualEdit, setShowManualEdit] = useState(false)
  const [manualMetadata, setManualMetadata] = useState<Partial<ProductMetadata>>({
    title: '',
    imageUrl: '',
    price: '',
    description: ''
  })
  const [autoMetadata, setAutoMetadata] = useState<ProductMetadata | null>(null)
  const [hasCalledParentCallback, setHasCalledParentCallback] = useState(false)
  const failedUrlsRef = useRef<Set<string>>(new Set())
  const rateLimitedRef = useRef<boolean>(false)
  const rateLimitTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousUrlRef = useRef<string>('')

  // Debounced URL for automatic metadata fetching
  const debouncedUrl = useDebounce(link, 1500) // 1.5 second delay
  const { extractMetadata, isLoading: isFetchingMetadata } = useUrlMetadata()

  // Initialize ref after extractMetadata is available
  const extractMetadataRef = useRef(extractMetadata)

  // Update ref when extractMetadata changes
  useEffect(() => {
    extractMetadataRef.current = extractMetadata
  }, [extractMetadata])

  // Determine if we should show the rich UI (when there's a URL input)
  const showRichUI = link?.trim() !== ''
  const currentMetadata = autoMetadata || metadata
  const hasMetadata = currentMetadata && (currentMetadata.title || currentMetadata.imageUrl)
  const isCurrentlyExtracting = isExtracting || isFetchingMetadata
  // Check if current URL has failed or if we're rate limited (for display purposes)
  const currentUrlFailed = debouncedUrl?.trim() ? failedUrlsRef.current.has(debouncedUrl.trim()) : false

  // Update showManualEdit state based on conditions
  useEffect(() => {
    const shouldShow = showRichUI && !isCurrentlyExtracting && (
      isEditingMetadata ||
      (!hasMetadata && debouncedUrl && isValidUrl(debouncedUrl) && (
        extractionFailed ||
        currentUrlFailed ||
        (extractionAttempted && !metadata && !autoMetadata)
      ))
    ) as boolean
    setShowManualEdit(shouldShow)

    // Debug logging - Always log when there's a URL
    if (debouncedUrl?.trim()) {
      // console.log(`[${index}] Manual edit decision for URL: ${debouncedUrl}`, {
      //   showRichUI,
      //   isCurrentlyExtracting,
      //   isEditingMetadata,
      //   hasMetadata,
      //   extractionFailed,
      //   currentUrlFailed,
      //   extractionAttempted,
      //   metadata: !!metadata,
      //   autoMetadata: !!autoMetadata,
      //   shouldShow,
      //   failedUrls: Array.from(failedUrlsRef.current),
      //   rateLimited: rateLimitedRef.current,
      //   isValidUrl: isValidUrl(debouncedUrl),
      //   conditions: {
      //     condition1_isEditingMetadata: isEditingMetadata,
      //     condition2_noMetadata: !hasMetadata,
      //     condition3_validUrl: debouncedUrl && isValidUrl(debouncedUrl),
      //     condition4_extractionFailed: extractionFailed,
      //     condition5_currentUrlFailed: currentUrlFailed,
      //     condition6_parentExtraction: extractionAttempted && !metadata && !autoMetadata
      //   }
      // })
    }
  }, [showRichUI, isCurrentlyExtracting, isEditingMetadata, hasMetadata, extractionFailed, extractionAttempted, metadata, autoMetadata, currentUrlFailed, debouncedUrl, isValidUrl, index])

  const handleExtractClick = async () => {
    const trimmedLink = link?.trim()
    if (trimmedLink && isValidUrl(trimmedLink)) {
      onExtractMetadata(trimmedLink)
    }
  }

  const handleSaveManualMetadata = () => {
    if (onMetadataManualUpdate && manualMetadata) {
      onMetadataManualUpdate(index, manualMetadata)
      setIsEditingMetadata(() => false)
    }
  }

  const handleCancelManualEdit = () => {
    setIsEditingMetadata(() => false)
    setManualMetadata({ title: '', imageUrl: '', price: '', description: '' })
  }


  // Note: Removed non-debounced auto-extraction to prevent API calls on every input

  // Debounced automatic metadata fetching
  useEffect(() => {
    const trimmedUrl = debouncedUrl?.trim()

    const fetchMetadata = async () => {
      // console.log(`[${index}] Auto extraction check for: ${trimmedUrl}`, {
      //   hasValidUrl: trimmedUrl && isValidUrl(trimmedUrl),
      //   hasMetadata: !!metadata,
      //   hasAutoMetadata: !!autoMetadata,
      //   shouldExtract: trimmedUrl && isValidUrl(trimmedUrl) && !metadata && !autoMetadata
      // })

      if (trimmedUrl && isValidUrl(trimmedUrl) && !metadata && !autoMetadata) {
        // Don't retry if we've already failed on this URL or if we're rate limited
        if (failedUrlsRef.current.has(trimmedUrl) || rateLimitedRef.current) {
          console.log(`[${index}] URL already failed or rate limited, setting extraction failed`)
          console.log(`[${index}] Failed URLs:`, Array.from(failedUrlsRef.current))
          console.log(`[${index}] Rate limited:`, rateLimitedRef.current)
          setExtractionFailed(true)
          return
        }

        console.log(`[${index}] Starting auto extraction for: ${trimmedUrl}`)
        try {
          const result = await extractMetadataRef.current(trimmedUrl)
          console.log(`[${index}] Auto extraction result:`, result)
          if (result.success && result.data) {
            console.log(`[${index}] Auto extraction succeeded`)
            setAutoMetadata(result.data)
            setExtractionFailed(false)
            // Remove from failed URLs if it was there
            failedUrlsRef.current.delete(trimmedUrl)
          } else {
            console.log(`[${index}] Auto extraction failed:`, result.error)
            setAutoMetadata(null)
            // Check if it's a rate limiting error
            if (result.error?.includes('Rate limit') || result.error?.includes('429')) {
              console.log(`[${index}] Rate limited`)
              rateLimitedRef.current = true
              // Clear rate limit after 60 seconds
              if (rateLimitTimeoutRef.current) {
                clearTimeout(rateLimitTimeoutRef.current)
              }
              rateLimitTimeoutRef.current = setTimeout(() => {
                rateLimitedRef.current = false
              }, 60000)
            } else {
              console.log(`[${index}] Adding to failed URLs and setting extraction failed`)
              // Add to failed URLs to prevent retries and show manual input
              failedUrlsRef.current.add(trimmedUrl)
              setExtractionFailed(true)
            }
          }
        } catch (error) {
          console.error(`[${index}] Auto metadata extraction exception:`, error)
          setAutoMetadata(null)
          // Add to failed URLs to prevent retries
          failedUrlsRef.current.add(trimmedUrl)
          setExtractionFailed(true)
        }
      }
    }

    fetchMetadata()

    // Set up fallback timeout to show manual input if no metadata after 5 seconds
    if (trimmedUrl && isValidUrl(trimmedUrl) && !metadata && !autoMetadata && !failedUrlsRef.current.has(trimmedUrl) && !rateLimitedRef.current) {
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current)
      }
      fallbackTimeoutRef.current = setTimeout(() => {
        console.log(`[${index}] Fallback timeout triggered - showing manual input for: ${trimmedUrl}`)
        if (!autoMetadata && !metadata) {
          setExtractionFailed(true)
          failedUrlsRef.current.add(trimmedUrl)
        }
      }, 5000)
    } else {
      // Clear timeout if conditions don't match
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current)
        fallbackTimeoutRef.current = null
      }
    }
    // Note: Using extractMetadataRef.current to avoid dependency on extractMetadata function

  }, [debouncedUrl, isValidUrl, metadata, autoMetadata, index])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (rateLimitTimeoutRef.current) {
        clearTimeout(rateLimitTimeoutRef.current)
      }
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current)
      }
    }
  }, [])

  // Reset callback flag and clear error states when URL changes
  useEffect(() => {
    const currentUrl = debouncedUrl?.trim() || ''
    const previousUrl = previousUrlRef.current

    // Only reset states if the URL actually changed to a different URL
    if (currentUrl !== previousUrl) {
      console.log(`[${index}] URL changed from "${previousUrl}" to "${currentUrl}", resetting extraction state`)

      setHasCalledParentCallback(false)
      setExtractionFailed(false)
      setIsEditingMetadata(false)
      setAutoMetadata(null)

      // Clear fallback timeout when URL changes
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current)
        fallbackTimeoutRef.current = null
      }

      // Update the previous URL reference
      previousUrlRef.current = currentUrl
    }
  }, [debouncedUrl, index])

  // Separate useEffect to handle parent callback when autoMetadata changes
  useEffect(() => {
    if (autoMetadata && onMetadataManualUpdate && !hasCalledParentCallback) {
      onMetadataManualUpdate(index, autoMetadata)
      setHasCalledParentCallback(true)
    }
    // Note: Intentionally not including onMetadataManualUpdate in deps to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMetadata, index, hasCalledParentCallback])

  // Set extraction failed state when extraction attempted but no metadata received
  useEffect(() => {
    if (extractionAttempted && !isExtracting && !hasMetadata && link?.trim() && isValidUrl(link.trim())) {
      setExtractionFailed(true)
    } else if (hasMetadata || !link?.trim()) {
      setExtractionFailed(false)
    }
  }, [extractionAttempted, isExtracting, hasMetadata, link, isValidUrl])

  useEffect(() => {
    if (currentMetadata) {
      setManualMetadata({
        title: currentMetadata.title || '',
        imageUrl: currentMetadata.imageUrl || '',
        price: currentMetadata.price || '',
        description: currentMetadata.description || ''
      })
    }
  }, [currentMetadata])


  // Single UI structure to prevent focus loss on re-render
  return (
    <div className={showRichUI ? "bg-slate-900/30 border border-slate-600/50 rounded-lg p-4 space-y-3" : ""}>
      {/* URL Section */}
      <div className="flex gap-3 items-start">
        <div className="flex-1">
          <Input
            value={link}
            onChange={(value) => onUpdate(index, value)}
            placeholder={showRichUI
              ? "Product URL"
              : `${t('wishlist.create.productLink')} ${index + 1} (${t('common.example')}: https://example.com/product)` || `상품 링크 ${index + 1} (예: https://example.com/product)`
            }
            className={showRichUI
              ? `bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 ${error ? 'border-red-500' : ''}`
              : `bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400 ${error ? 'border-red-500' : ''}`
            }
            disabled={loading}
          />
          {error && (
            <p className="text-red-400 text-xs mt-1">{error}</p>
          )}
        </div>

        <div className="flex items-start gap-2">
          {/* Extract Metadata Button - Only show in rich UI mode */}
          {showRichUI && isValidUrl(link.trim()) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleExtractClick}
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 p-2 h-10"
              disabled={loading || isExtracting}
              title="Extract product information automatically"
            >
              <SparklesIcon className={`w-4 h-4 ${isExtracting ? 'animate-spin' : ''}`} />
            </Button>
          )}

          {/* Remove Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 h-10"
            disabled={loading}
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Loading State - Only show in rich UI mode */}
      {showRichUI && isCurrentlyExtracting && (
        <div className="flex items-center gap-3 py-4 text-slate-300">
          <SparklesIcon className="w-5 h-5 animate-pulse text-purple-400" />
          <span className="text-sm">
            {isFetchingMetadata ? 'Auto-extracting product information...' : 'Extracting product information...'}
          </span>
        </div>
      )}

      {/* Metadata Display/Edit Section - Only show in rich UI mode */}
      {showRichUI && hasMetadata && !isEditingMetadata ? (
        <div className="border-t border-slate-600/30 pt-3">
          <div className="flex items-start gap-3">
            {/* Product Thumbnail */}
            <div className="flex-shrink-0">
              {currentMetadata?.imageUrl?.trim() ? (
                <Image
                  src={currentMetadata.imageUrl.trim()}
                  alt={currentMetadata.title?.trim() || 'Product'}
                  className="w-20 h-20 object-cover rounded-lg bg-slate-800 border border-slate-600/30"
                  onError={() => {
                    // Handle image load error
                  }}
                  width={80}
                  height={80}
                />
              ) : (
                <div className="w-20 h-20 bg-slate-800 rounded-lg border border-slate-600/30 flex items-center justify-center">
                  <PhotoIcon className="w-8 h-8 text-slate-500" />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-white text-base line-clamp-2 mb-2">
                {currentMetadata?.title?.trim() || 'Untitled Product'}
              </h4>
              {currentMetadata?.price?.trim() && (
                <p className="text-green-400 font-semibold text-sm mb-2">
                  {currentMetadata.price.trim()}
                </p>
              )}
              {currentMetadata?.description?.trim() && (
                <p className="text-slate-400 text-sm line-clamp-2 mb-2">
                  {currentMetadata.description.trim()}
                </p>
              )}
              {currentMetadata?.siteName?.trim() && (
                <p className="text-slate-500 text-xs">
                  from {currentMetadata.siteName.trim()}
                </p>
              )}
            </div>

            {/* Edit Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingMetadata(() => true)}
              className="text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 p-2"
              title="Edit product information"
            >
              <PencilIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {/* Manual Input Section */}
      {(showManualEdit || isEditingMetadata) && (
        <div className="border-t border-slate-600/30 pt-3 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <PhotoIcon className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-300 font-medium">Product Information</span>
            {showManualEdit && !isEditingMetadata && (
              <span className="text-xs text-slate-500 ml-auto">
                {rateLimitedRef.current
                  ? 'Rate limited - please wait and try again later'
                  : currentUrlFailed
                    ? 'Auto-extraction failed for this URL - please enter manually'
                    : 'Auto-extraction failed - please enter manually'
                }
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="md:col-span-2 col-span-6 space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Product Image (Optional)</label>
                <ImageUpload
                  value={manualMetadata.imageUrl || ''}
                  onChange={(imageUrl) => setManualMetadata(prev => ({ ...prev, imageUrl: imageUrl || '' }))}
                  placeholder="Upload image"
                  width={120}
                  height={120}
                  maxSizeKB={1024} // 1MB limit
                  className="w-full"
                />
              </div>
            </div>
            <div className="md:col-span-4 col-span-6 space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Product Name</label>
                <Input
                  value={manualMetadata.title || ''}
                  onChange={(value) => setManualMetadata(prev => ({ ...prev, title: value }))}
                  placeholder="Enter product name"
                  className="bg-slate-800/50 border-slate-600 text-white text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Price (Optional)</label>
                <Input
                  value={manualMetadata.price || ''}
                  onChange={(value) => setManualMetadata(prev => ({ ...prev, price: value }))}
                  placeholder="$0.00"
                  className="bg-slate-800/50 border-slate-600 text-white text-sm"
                />
              </div>
            </div>

          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Description (Optional)</label>
            <Input
              value={manualMetadata.description || ''}
              onChange={(value) => setManualMetadata(prev => ({ ...prev, description: value }))}
              placeholder="Product description"
              className="bg-slate-800/50 border-slate-600 text-white text-sm"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              size="sm"
              onClick={handleSaveManualMetadata}
              className="bg-green-600 hover:bg-green-700 text-white text-sm px-3"
              disabled={!manualMetadata.title?.trim()}
            >
              <CheckIcon className="w-3 h-3 mr-1" />
              Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancelManualEdit}
              className="text-slate-400 hover:text-slate-300 text-sm px-3"
            >
              <XMarkIcon className="w-3 h-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}