'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GlobeAltIcon, PlusIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'
import { useBatchUrlMetadata } from '@/hooks/use-url-metadata'
import type { ProductMetadata } from '@/lib/services/url-metadata'
import ProductLinkItem from './product-link-item'

interface ProductLinksProps {
  productLinks: string[]
  setProductLinks: React.Dispatch<React.SetStateAction<string[]>>
  linkErrors: Record<number, string>
  setLinkErrors: React.Dispatch<React.SetStateAction<Record<number, string>>>
  loading: boolean
  isValidUrl: (string: string) => boolean
  onMetadataExtracted?: (index: number, metadata: ProductMetadata) => void
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

          {/* {productLinks.map((link, index) => (
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
          ))} */}

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