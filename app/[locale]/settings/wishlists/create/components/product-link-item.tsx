'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TrashIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'
import useDebounce from '@/hooks/use-debounce'
import { useAutoMetadataExtraction } from '@/hooks/use-auto-metadata-extraction'
import type { ProductMetadata } from '@/lib/services/url-metadata'
import MetadataDisplay from './metadata-display'
import MetadataEditForm from './metadata-edit-form'

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
  isGloballyRateLimited?: boolean
  onRateLimitDetected?: () => void
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
  extractionAttempted,
  isGloballyRateLimited,
  onRateLimitDetected
}: ProductLinkItemProps) {
  const { t } = useI18n()
  const [isEditingMetadata, setIsEditingMetadata] = useState(false)
  const [showManualEdit, setShowManualEdit] = useState(false)
  const [manualMetadata, setManualMetadata] = useState<Partial<ProductMetadata>>({
    title: '',
    imageUrl: '',
    price: '',
    description: ''
  })

  const debouncedUrl = useDebounce(link, 1500)

  // Use custom hook for auto metadata extraction
  const {
    autoMetadata,
    extractionFailed,
    isFetchingMetadata,
    currentUrlFailed
  } = useAutoMetadataExtraction({
    debouncedUrl,
    isValidUrl,
    metadata,
    isGloballyRateLimited,
    onRateLimitDetected,
    onMetadataExtracted: (extractedMetadata) => {
      if (onMetadataManualUpdate) {
        onMetadataManualUpdate(index, extractedMetadata)
      }
    },
    index
  })

  const showRichUI = link?.trim() !== ''
  const currentMetadata = autoMetadata || metadata
  const hasMetadata = currentMetadata && (currentMetadata.title || currentMetadata.imageUrl)
  const isCurrentlyExtracting = isExtracting || isFetchingMetadata

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
  }, [showRichUI, isCurrentlyExtracting, isEditingMetadata, hasMetadata, extractionFailed, extractionAttempted, metadata, autoMetadata, currentUrlFailed, debouncedUrl, isValidUrl])

  // Update manual metadata when current metadata changes
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

  // Set extraction failed state when extraction attempted but no metadata received
  useEffect(() => {
    if (extractionAttempted && !isExtracting && !hasMetadata && link?.trim() && isValidUrl(link.trim())) {
      // Extraction failed state is already handled by the hook
    }
  }, [extractionAttempted, isExtracting, hasMetadata, link, isValidUrl])

  const handleExtractClick = () => {
    const trimmedLink = link?.trim()
    if (trimmedLink && isValidUrl(trimmedLink)) {
      onExtractMetadata(trimmedLink)
    }
  }

  const handleSaveManualMetadata = () => {
    if (onMetadataManualUpdate && manualMetadata) {
      onMetadataManualUpdate(index, manualMetadata)
      setIsEditingMetadata(false)
    }
  }

  const handleCancelManualEdit = () => {
    setIsEditingMetadata(false)
    setManualMetadata({ title: '', imageUrl: '', price: '', description: '' })
  }

  return (
    <div className={showRichUI ? "bg-slate-900/30 border border-slate-600/50 rounded-lg p-4 space-y-3" : ""}>
      {/* URL Input Section */}
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
          {/* Extract Metadata Button */}
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

      {/* Loading State */}
      {showRichUI && isCurrentlyExtracting && (
        <div className="flex items-center gap-3 py-4 text-slate-300">
          <SparklesIcon className="w-5 h-5 animate-pulse text-purple-400" />
          <span className="text-sm">
            {isFetchingMetadata ? 'Auto-extracting product information...' : 'Extracting product information...'}
          </span>
        </div>
      )}

      {/* Metadata Display */}
      {showRichUI && hasMetadata && !isEditingMetadata && currentMetadata && (
        <MetadataDisplay
          metadata={currentMetadata}
          onEdit={() => setIsEditingMetadata(true)}
        />
      )}

      {/* Metadata Edit Form */}
      {(showManualEdit || isEditingMetadata) && (
        <MetadataEditForm
          metadata={manualMetadata}
          onChange={setManualMetadata}
          onSave={handleSaveManualMetadata}
          onCancel={handleCancelManualEdit}
          isEditing={isEditingMetadata}
          isGloballyRateLimited={isGloballyRateLimited}
          currentUrlFailed={currentUrlFailed}
        />
      )}
    </div>
  )
}
