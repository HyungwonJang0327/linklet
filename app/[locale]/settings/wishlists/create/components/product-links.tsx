'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ImageUpload from '@/components/ui/image-upload'
import { GlobeAltIcon, PlusIcon, TrashIcon, SparklesIcon, PhotoIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'
import { useBatchUrlMetadata } from '@/hooks/use-url-metadata'
import type { ProductMetadata } from '@/lib/services/url-metadata'
import Image from 'next/image'

interface ProductLinksProps {
  productLinks: string[]
  setProductLinks: React.Dispatch<React.SetStateAction<string[]>>
  linkErrors: Record<number, string>
  setLinkErrors: React.Dispatch<React.SetStateAction<Record<number, string>>>
  loading: boolean
  isValidUrl: (string: string) => boolean
  onMetadataExtracted?: (index: number, metadata: ProductMetadata) => void
}

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

function ProductLinkItem({
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
  const [manualMetadata, setManualMetadata] = useState<Partial<ProductMetadata>>({
    title: '',
    imageUrl: '',
    price: '',
    description: ''
  })

  // Determine if we should show the rich UI (when there's a URL input)
  const showRichUI = link?.trim() !== ''
  const hasMetadata = metadata && (metadata.title || metadata.imageUrl)
  const showManualEdit = showRichUI && !hasMetadata && !isExtracting && extractionFailed

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

  // Auto-extract metadata when valid URL is entered
  useEffect(() => {
    const trimmedLink = link?.trim()
    if (trimmedLink && isValidUrl(trimmedLink) && !metadata && !isExtracting && !extractionAttempted) {
      // Automatically trigger metadata extraction
      onExtractMetadata(trimmedLink)
    }
  }, [link, isValidUrl, metadata, isExtracting, extractionAttempted, onExtractMetadata])

  // Set extraction failed state when extraction attempted but no metadata received
  useEffect(() => {
    if (extractionAttempted && !isExtracting && !hasMetadata && link?.trim() && isValidUrl(link.trim())) {
      setExtractionFailed(true)
    } else if (hasMetadata || !link?.trim()) {
      setExtractionFailed(false)
    }
  }, [extractionAttempted, isExtracting, hasMetadata, link, isValidUrl])

  useEffect(() => {
    if (metadata) {
      setManualMetadata({
        title: metadata.title || '',
        imageUrl: metadata.imageUrl || '',
        price: metadata.price || '',
        description: metadata.description || ''
      })
    }
  }, [metadata])

  // Simple input mode (when no URL is entered yet)
  if (!showRichUI) {
    return (
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            value={link}
            onChange={(value) => onUpdate(index, value)}
            placeholder={`${t('wishlist.create.productLink')} ${index + 1} (${t('common.example')}: https://example.com/product)` || `상품 링크 ${index + 1} (예: https://example.com/product)`}
            className={`bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400 ${error ? 'border-red-500' : ''
              }`}
            disabled={loading}
          />
          {error && (
            <p className="text-red-400 text-xs mt-1">{error}</p>
          )}
        </div>

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
    )
  }

  // Rich list UI mode (when URL is entered)
  return (
    <div className="bg-slate-900/30 border border-slate-600/50 rounded-lg p-4 space-y-3">
      {/* URL Section */}
      <div className="flex gap-3 items-start">
        <div className="flex-1">
          <Input
            value={link}
            onChange={(value) => onUpdate(index, value)}
            placeholder="Product URL"
            className={`bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 ${error ? 'border-red-500' : ''
              }`}
            disabled={loading}
          />
          {error && (
            <p className="text-red-400 text-xs mt-1">{error}</p>
          )}
        </div>

        <div className="flex items-start gap-2">
          {/* Extract Metadata Button */}
          {isValidUrl(link.trim()) && (
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
      {isExtracting && (
        <div className="flex items-center gap-3 py-4 text-slate-300">
          <SparklesIcon className="w-5 h-5 animate-pulse text-purple-400" />
          <span className="text-sm">Extracting product information...</span>
        </div>
      )}

      {/* Metadata Display/Edit Section */}
      {hasMetadata && !isEditingMetadata ? (
        <div className="border-t border-slate-600/30 pt-3">
          <div className="flex items-start gap-3">
            {/* Product Thumbnail */}
            <div className="flex-shrink-0">
              {metadata.imageUrl?.trim() ? (
                <Image
                  src={metadata.imageUrl.trim()}
                  alt={metadata.title?.trim() || 'Product'}
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
                {metadata.title?.trim() || 'Untitled Product'}
              </h4>
              {metadata.price?.trim() && (
                <p className="text-green-400 font-semibold text-sm mb-2">
                  {metadata.price.trim()}
                </p>
              )}
              {metadata.description?.trim() && (
                <p className="text-slate-400 text-sm line-clamp-2 mb-2">
                  {metadata.description.trim()}
                </p>
              )}
              {metadata.siteName?.trim() && (
                <p className="text-slate-500 text-xs">
                  from {metadata.siteName.trim()}
                </p>
              )}
            </div>

            {/* Edit Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingMetadata(true)}
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
              <span className="text-xs text-slate-500 ml-auto">Auto-extraction failed - please enter manually</span>
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

export default function ProductLinks({
  productLinks,
  setProductLinks,
  linkErrors,
  setLinkErrors,
  loading,
  isValidUrl,
  onMetadataExtracted
}: ProductLinksProps) {
  const { t } = useI18n()
  const { extractBatchMetadata, getMetadataForUrl, isUrlLoading } = useBatchUrlMetadata()
  const [extractedCount, setExtractedCount] = useState(0)
  const [extractionAttempted, setExtractionAttempted] = useState<Record<string, boolean>>({})

  const addProductLink = () => {
    if (productLinks.length < 10) {
      setProductLinks([...productLinks, ''])
    }
  }

  const removeProductLink = (index: number) => {
    if (productLinks.length > 1) {
      const newLinks = productLinks.filter((_, i) => i !== index)
      setProductLinks(newLinks)

      // Remove error for removed link
      const newErrors = { ...linkErrors }
      delete newErrors[index]
      setLinkErrors(newErrors)
    }
  }

  const updateProductLink = (index: number, value: string) => {
    const newLinks = [...productLinks]
    newLinks[index] = value
    setProductLinks(newLinks)

    // Clear error when user starts typing
    if (linkErrors[index]) {
      const newErrors = { ...linkErrors }
      delete newErrors[index]
      setLinkErrors(newErrors)
    }
  }

  const handleExtractMetadata = async (url: string) => {
    if (!url?.trim()) {
      console.error('Invalid URL provided for metadata extraction')
      return
    }

    const trimmedUrl = url.trim()

    // Mark extraction as attempted for this URL
    setExtractionAttempted(prev => ({
      ...prev,
      [trimmedUrl]: true
    }))

    try {
      const results = await extractBatchMetadata([trimmedUrl])
      const result = results?.[0]
      if (result?.result?.success && result.result?.data && onMetadataExtracted) {
        const index = productLinks?.findIndex(link => link?.trim() === trimmedUrl) ?? -1
        if (index !== -1) {
          onMetadataExtracted(index, result.result.data)
        }
      }
      setExtractedCount(prev => (prev ?? 0) + 1)
    } catch (error) {
      console.error('Failed to extract metadata:', error)
    }
  }

  const handleBulkExtract = async () => {
    if (!productLinks?.length) return

    const validLinks = productLinks
      .filter(link => link?.trim())
      .filter(link => isValidUrl(link.trim()))

    if (validLinks.length === 0) return

    try {
      const results = await extractBatchMetadata(validLinks.map(link => link.trim()))
      if (Array.isArray(results)) {
        results.forEach(({ url, result }) => {
          if (result?.success && result?.data && onMetadataExtracted) {
            const index = productLinks.findIndex(link => link?.trim() === url?.trim())
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
  }

  const handleManualMetadataUpdate = (index: number, metadata: Partial<ProductMetadata>) => {
    if (onMetadataExtracted) {
      // Convert partial metadata to full ProductMetadata with required fields
      const fullMetadata: ProductMetadata = {
        url: productLinks[index],
        title: metadata.title || '',
        description: metadata.description || undefined,
        imageUrl: metadata.imageUrl || undefined,
        price: metadata.price || undefined,
        siteName: undefined // This will be filled if available
      }
      onMetadataExtracted(index, fullMetadata)
    }
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <GlobeAltIcon className="w-6 h-6 text-green-400" />
          <div>
            <h2 className="text-xl font-semibold text-white">{t('wishlist.create.productLinks') || '상품 링크 추가 (선택사항)'}</h2>
            <p className="text-sm text-slate-400 mt-1">{t('wishlist.create.productLinksDesc') || '위시리스트 생성과 함께 원하는 상품들을 바로 추가해보세요'}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Bulk Extract Button */}
          {productLinks.some(link => link.trim() && isValidUrl(link)) && (
            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBulkExtract}
                className="text-purple-400 border-purple-500/50 hover:bg-purple-500/10"
                disabled={loading}
              >
                <SparklesIcon className="w-4 h-4 mr-2" />
                Extract All Product Info
              </Button>
              {extractedCount > 0 && (
                <span className="text-xs text-slate-400">
                  {extractedCount} items processed
                </span>
              )}
            </div>
          )}

          {productLinks.map((link, index) => (
            <ProductLinkItem
              key={index}
              index={index}
              link={link}
              error={linkErrors[index]}
              loading={loading}
              isValidUrl={isValidUrl}
              onUpdate={updateProductLink}
              onRemove={productLinks.length > 1 ? removeProductLink : () => { }}
              onExtractMetadata={handleExtractMetadata}
              metadata={getMetadataForUrl(link)?.data}
              isExtracting={isUrlLoading(link)}
              onMetadataManualUpdate={handleManualMetadataUpdate}
              extractionAttempted={extractionAttempted[link?.trim()] || false}
            />
          ))}

          {/* Add Link Button */}
          {productLinks.length < 10 && (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addProductLink}
                className="text-green-400 hover:text-green-300 hover:bg-green-500/10 p-2"
                disabled={loading}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Product Link
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
            <span>{t('wishlist.create.maxLinks') || 'Up to 10 product links can be added'}</span>
            <span>{productLinks.filter(link => link.trim()).length}/10</span>
          </div>
        </div>
      </div>
    </Card>
  )
}