'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n/context'
import { useAuth } from '@/components/providers/auth-provider'
import { useCreateWishlist } from '@/hooks/use-wishlist'
import { isValidUrl } from '@/lib/utils/url-validator'
import { RateLimitProvider } from '@/contexts/rate-limit-context'
import { APP_CONFIG } from '@/lib/constants'
import type { ProductMetadata } from '@/lib/services/url-metadata'
import CreateHeader from './components/create-header'
import BasicInformation from './components/basic-information'
import ProductLinks from './components/product-links'
import PrivacySettings from './components/privacy-settings'
import FormActions from './components/form-actions'

export default function CreateWishlistPage() {
  const router = useRouter()
  const { locale = 'kr' } = useParams()
  const { t } = useI18n()
  const { user, isAuthenticated } = useAuth()
  const createWishlistMutation = useCreateWishlist()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublic: true,
    category: 'general'
  })

  const [productLinks, setProductLinks] = useState<string[]>([''])
  const [linkErrors, setLinkErrors] = useState<Record<number, string>>({})
  const [productMetadata, setProductMetadata] = useState<Record<number, ProductMetadata>>({})

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const loading = createWishlistMutation.isPending

  // Check if there are valid URLs without metadata (potentially still extracting)
  const hasIncompleteMetadata = productLinks
    .map((link, index) => ({ link: link.trim(), index }))
    .filter(({ link }) => link && isValidUrl(link))
    .some(({ index }) => !productMetadata[index])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = t('wishlist.create.errors.titleRequired') || '위시리스트 제목을 입력해주세요'
    } else if (formData.title.trim().length < 2) {
      newErrors.title = t('wishlist.create.errors.titleTooShort') || '제목은 2글자 이상 입력해주세요'
    } else if (formData.title.trim().length > 50) {
      newErrors.title = t('wishlist.create.errors.titleTooLong') || '제목은 50글자 이하로 입력해주세요'
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = t('wishlist.create.errors.descriptionTooLong') || '설명은 200글자 이하로 입력해주세요'
    }

    // Validate product links - at least one valid link is required
    const validLinks = productLinks.filter(link => link.trim() !== '' && isValidUrl(link.trim()))
    if (validLinks.length === 0) {
      newErrors.productLinks = t('wishlist.create.errors.productLinksRequired') || '상품 URL을 한 개 이상 입력해주세요.'
    }

    // Validate product links format
    const linkValidationErrors: Record<number, string> = {}
    const seenUrls = new Set<string>()

    productLinks.forEach((link, index) => {
      const trimmedLink = link.trim()

      if (trimmedLink) {
        // Check URL format and protocol
        if (!isValidUrl(trimmedLink)) {
          linkValidationErrors[index] = t('wishlist.create.errors.invalidUrl') || '유효한 URL을 입력해주세요'
        }
        // Check for duplicate URLs
        else if (seenUrls.has(trimmedLink)) {
          linkValidationErrors[index] = t('wishlist.create.errors.duplicateUrl') || '중복된 URL입니다'
        } else {
          seenUrls.add(trimmedLink)
        }
      }
    })
    setLinkErrors(linkValidationErrors)

    // Add general error message if there are invalid links
    const invalidLinkCount = Object.keys(linkValidationErrors).length
    if (invalidLinkCount > 0 && !newErrors.productLinks) {
      newErrors.productLinks = t('wishlist.create.errors.invalidLinksFound')?.replace('{count}', String(invalidLinkCount))
        || `입력한 링크 중 ${invalidLinkCount}개가 유효하지 않습니다. 링크를 확인해주세요.`
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0 && Object.keys(linkValidationErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return
    if (!isAuthenticated || !user) {
      setErrors({ auth: t('wishlist.create.errors.authRequired') || 'You must be logged in to create a wishlist' })
      return
    }

    // Prevent concurrent metadata updates during submission
    setIsSubmitting(true)

    // Check if there are valid URLs without metadata (potentially still extracting)
    const linksWithoutMetadata = productLinks
      .map((link, index) => ({ link: link.trim(), index }))
      .filter(({ link }) => link && isValidUrl(link))
      .filter(({ index }) => !productMetadata[index])

    if (linksWithoutMetadata.length > 0) {
      const count = linksWithoutMetadata.length
      setErrors({
        submit: t('wishlist.create.errors.metadataExtractingOrFailed')?.replace('{count}', String(count))
          || `${count}개의 링크에 대한 메타데이터가 아직 추출되지 않았습니다. 추출이 완료될 때까지 기다리거나 수동으로 입력해주세요.`
      })
      setIsSubmitting(false)
      return
    }

    try {
      // Prepare wishlist data with extracted metadata
      const validLinks = productLinks.filter(link => link.trim() !== '')
      const wishlistData = {
        ...formData,
        category: formData.category.toUpperCase(),
        userId: user.id,
        productLinks: validLinks.map((link, index) => ({
          url: link,
          metadata: productMetadata[index] || null
        }))
      }

      await createWishlistMutation.mutateAsync(wishlistData)

      // Redirect back to wishlists page
      router.push(`/${locale}/settings/wishlists`)
    } catch (error) {
      console.error('Failed to create wishlist:', error)

      // Check if it's a wishlist limit error
      const errorMessage = error instanceof Error ? error.message : 'Failed to create wishlist'

      if (errorMessage.includes('WISHLIST_LIMIT_REACHED')) {
        const limit = APP_CONFIG.maxWishlistsPerUser.free
        const localizedMessage = t('wishlist.create.errors.wishlistLimitReached')?.replace('{limit}', String(limit))
          || `위시리스트는 최대 ${limit}개까지만 만들 수 있습니다`

        toast.error(localizedMessage, { duration: 4000 })

        // Redirect back to wishlists page
        setTimeout(() => {
          router.push(`/${locale}/settings/wishlists`)
        }, 1500)
      } else {
        setErrors({
          submit: errorMessage
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    router.push(`/${locale}/settings/wishlists`)
  }

  const handleMetadataExtracted = (index: number, metadata: ProductMetadata) => {
    // Prevent metadata updates during form submission to avoid race conditions
    if (isSubmitting) return

    setProductMetadata(prev => ({
      ...prev,
      [index]: metadata
    }))
  }

  return (
    <RateLimitProvider>
      <div className="max-w-4xl mx-auto space-y-6">
        <CreateHeader onBack={handleBack} />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* System-level Error Display - Auth and Submission Errors */}
          {(errors.auth || errors.submit) && (
            <div className="bg-red-900/50 border border-red-600 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="text-red-400 text-sm">
                  {errors.auth || errors.submit}
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <BasicInformation
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            loading={loading}
          />

          {/* Product Links */}
          <ProductLinks
            productLinks={productLinks}
            setProductLinks={setProductLinks}
            linkErrors={linkErrors}
            setLinkErrors={setLinkErrors}
            loading={loading || isSubmitting}
            isValidUrl={isValidUrl}
            onMetadataExtracted={handleMetadataExtracted}
            error={errors.productLinks}
          />

          {/* Privacy Settings */}
          <PrivacySettings
            formData={formData}
            setFormData={setFormData}
          />

          {/* Action Buttons */}
          <FormActions
            onBack={handleBack}
            loading={loading}
            hasIncompleteMetadata={hasIncompleteMetadata}
          />
        </form>
      </div>
    </RateLimitProvider>
  )
}