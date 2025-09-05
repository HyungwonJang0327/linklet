'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n/context'
import { useAuth } from '@/components/providers/auth-provider'
import { useCreateWishlist } from '@/hooks/use-wishlist'
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
  const loading = createWishlistMutation.isPending

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

    setErrors(newErrors)

    // Validate product links
    const linkValidationErrors: Record<number, string> = {}
    productLinks.forEach((link, index) => {
      if (link && !isValidUrl(link)) {
        linkValidationErrors[index] = t('wishlist.create.errors.invalidUrl') || '유효한 URL을 입력해주세요'
      }
    })
    setLinkErrors(linkValidationErrors)

    return Object.keys(newErrors).length === 0 && Object.keys(linkValidationErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return
    if (!isAuthenticated || !user) {
      setErrors({ auth: 'You must be logged in to create a wishlist' })
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

      console.log('Creating wishlist:', wishlistData)

      const result = await createWishlistMutation.mutateAsync(wishlistData)

      console.log('Wishlist created successfully:', result)

      // Redirect back to wishlists page
      router.push(`/${locale}/settings/wishlists`)
    } catch (error) {
      console.error('Failed to create wishlist:', error)
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to create wishlist'
      })
    }
  }

  const handleBack = () => {
    router.push(`/${locale}/settings/wishlists`)
  }

  const handleMetadataExtracted = (index: number, metadata: ProductMetadata) => {
    setProductMetadata(prev => ({
      ...prev,
      [index]: metadata
    }))
  }

  const isValidUrl = (string: string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <CreateHeader onBack={handleBack} />

      <form onSubmit={handleSubmit} className="space-y-6">
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
          loading={loading}
          isValidUrl={isValidUrl}
          onMetadataExtracted={handleMetadataExtracted}
        />

        {/* Privacy Settings */}
        <PrivacySettings
          formData={formData}
          setFormData={setFormData}
        />

        {/* Error Display */}
        {(errors.auth || errors.submit) && (
          <div className="bg-red-900/50 border border-red-600 rounded-lg p-4">
            <div className="text-red-400 text-sm">
              {errors.auth || errors.submit}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <FormActions onBack={handleBack} loading={loading} />
      </form>
    </div>
  )
}