'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GlobeAltIcon, PlusIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'
import { useProductMetadataManager } from '@/hooks/use-product-metadata-manager'
import { useRateLimit } from '@/contexts/rate-limit-context'
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
  error?: string
}

export default function ProductLinks({
  productLinks,
  setProductLinks,
  linkErrors,
  setLinkErrors,
  loading,
  isValidUrl,
  onMetadataExtracted,
  error,
}: ProductLinksProps) {
  const { t } = useI18n()
  const { isGloballyRateLimited, rateLimitSecondsLeft, handleRateLimitDetected } = useRateLimit()

  const {
    extractedCount,
    extractionAttempted,
    handleExtractMetadata,
    handleBulkExtract,
    getMetadataForUrl,
    isUrlLoading,
  } = useProductMetadataManager({
    productLinks,
    isValidUrl,
    onMetadataExtracted,
  })

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
    <Card className={`bg-slate-800/50 backdrop-blur-sm ${error ? 'border-red-500' : 'border-slate-700/50'}`}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <GlobeAltIcon className="w-6 h-6 text-green-400" />
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">
              {t('wishlist.create.productLinks') || '상품 링크 추가'} <span className="text-red-400">*</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">{t('wishlist.create.productLinksDesc') || '최소 1개 이상의 상품 링크를 추가해주세요'}</p>
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </div>
        </div>

        {/* Global Rate Limit Warning */}
        {isGloballyRateLimited && (
          <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-yellow-400 text-sm font-medium">
                    {t('wishlist.create.rateLimitWarning.title') || '일시적으로 자동 추출이 제한되었습니다'}
                  </p>
                  {rateLimitSecondsLeft > 0 && (
                    <span className="text-yellow-400 text-sm font-mono font-bold">
                      {rateLimitSecondsLeft}s
                    </span>
                  )}
                </div>
                <p className="text-yellow-300/80 text-xs mt-1">
                  {rateLimitSecondsLeft > 0
                    ? `${rateLimitSecondsLeft}초 후 자동 추출을 다시 시도할 수 있습니다.`
                    : (t('wishlist.create.rateLimitWarning.message') || '너무 많은 요청으로 인해 60초 동안 자동 메타데이터 추출이 차단되었습니다. 잠시 후 다시 시도하거나 수동으로 입력해주세요.')
                  }
                </p>
              </div>
            </div>
          </div>
        )}

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
                  {extractedCount.toLocaleString()} items processed
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
              metadata={getMetadataForUrl(link)?.data ?? undefined}
              isExtracting={isUrlLoading(link)}
              onMetadataManualUpdate={handleManualMetadataUpdate}
              extractionAttempted={extractionAttempted[link?.trim()] || false}
              isGloballyRateLimited={isGloballyRateLimited}
              onRateLimitDetected={handleRateLimitDetected}
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
            <span>{productLinks.filter(link => link.trim()).length.toLocaleString()}/10</span>
          </div>
        </div>
      </div>
    </Card>
  )
}