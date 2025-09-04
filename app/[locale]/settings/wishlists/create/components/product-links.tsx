'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GlobeAltIcon, PlusIcon, TrashIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'
import { useBatchUrlMetadata } from '@/hooks/use-url-metadata'
import type { ProductMetadata } from '@/lib/services/url-metadata'

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
  isExtracting 
}: ProductLinkItemProps) {
  const { t } = useI18n()
  const [showMetadata, setShowMetadata] = useState(false)

  const handleExtractClick = () => {
    if (link && isValidUrl(link)) {
      onExtractMetadata(link)
    }
  }

  useEffect(() => {
    if (metadata) {
      setShowMetadata(true)
    }
  }, [metadata])

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            value={link}
            onChange={(value) => onUpdate(index, value)}
            placeholder={`${t('wishlist.create.productLink')} ${index + 1} (${t('common.example')}: https://example.com/product)` || `상품 링크 ${index + 1} (예: https://example.com/product)`}
            className={`bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400 ${
              error ? 'border-red-500' : ''
            }`}
            disabled={loading}
          />
          {error && (
            <p className="text-red-400 text-xs mt-1">{error}</p>
          )}
        </div>
        
        <div className="flex items-start gap-2">
          {/* Extract Metadata Button */}
          {link && isValidUrl(link) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleExtractClick}
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 p-2 h-10"
              disabled={loading || isExtracting}
              title="Extract product information"
            >
              <SparklesIcon className={`w-4 h-4 ${isExtracting ? 'animate-pulse' : ''}`} />
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

      {/* Metadata Preview */}
      {showMetadata && metadata && (
        <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4 ml-2">
          <div className="flex items-start gap-3">
            {metadata.imageUrl && (
              <img
                src={metadata.imageUrl}
                alt={metadata.title || 'Product'}
                className="w-16 h-16 object-cover rounded-lg bg-slate-800"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            )}
            <div className="flex-1 min-w-0">
              {metadata.title && (
                <h4 className="font-medium text-white text-sm line-clamp-2">
                  {metadata.title}
                </h4>
              )}
              {metadata.price && (
                <p className="text-green-400 text-sm font-medium mt-1">
                  {metadata.price}
                </p>
              )}
              {metadata.description && (
                <p className="text-slate-400 text-xs mt-1 line-clamp-2">
                  {metadata.description}
                </p>
              )}
              {metadata.siteName && (
                <p className="text-slate-500 text-xs mt-1">
                  from {metadata.siteName}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowMetadata(false)}
              className="text-slate-400 hover:text-slate-300 p-1 h-6 w-6"
            >
              ×
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
    try {
      const results = await extractBatchMetadata([url])
      const result = results[0]
      if (result?.result.success && result.result.data && onMetadataExtracted) {
        const index = productLinks.findIndex(link => link === url)
        if (index !== -1) {
          onMetadataExtracted(index, result.result.data)
        }
      }
      setExtractedCount(prev => prev + 1)
    } catch (error) {
      console.error('Failed to extract metadata:', error)
    }
  }

  const handleBulkExtract = async () => {
    const validLinks = productLinks.filter(link => link.trim() && isValidUrl(link))
    if (validLinks.length === 0) return

    try {
      const results = await extractBatchMetadata(validLinks)
      results.forEach(({ url, result }) => {
        if (result.success && result.data && onMetadataExtracted) {
          const index = productLinks.findIndex(link => link === url)
          if (index !== -1) {
            onMetadataExtracted(index, result.data)
          }
        }
      })
      setExtractedCount(results.length)
    } catch (error) {
      console.error('Failed to extract metadata:', error)
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
              onRemove={productLinks.length > 1 ? removeProductLink : () => {}}
              onExtractMetadata={handleExtractMetadata}
              metadata={getMetadataForUrl(link)?.data}
              isExtracting={isUrlLoading(link)}
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