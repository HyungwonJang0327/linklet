'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import CreateHeader from './components/create-header'
import BasicInformation from './components/basic-information'
import ProductLinks from './components/product-links'
import PrivacySettings from './components/privacy-settings'
import FormActions from './components/form-actions'

export default function CreateWishlistPage() {
  const router = useRouter()
  const { locale = 'kr' } = useParams()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublic: true,
    category: 'general'
  })

  const [productLinks, setProductLinks] = useState<string[]>([''])
  const [linkErrors, setLinkErrors] = useState<Record<number, string>>({})

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = '위시리스트 제목을 입력해주세요'
    } else if (formData.title.trim().length < 2) {
      newErrors.title = '제목은 2글자 이상 입력해주세요'
    } else if (formData.title.trim().length > 50) {
      newErrors.title = '제목은 50글자 이하로 입력해주세요'
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = '설명은 200글자 이하로 입력해주세요'
    }

    setErrors(newErrors)

    // Validate product links
    const linkValidationErrors: Record<number, string> = {}
    productLinks.forEach((link, index) => {
      if (link && !isValidUrl(link)) {
        linkValidationErrors[index] = '유효한 URL을 입력해주세요'
      }
    })
    setLinkErrors(linkValidationErrors)

    return Object.keys(newErrors).length === 0 && Object.keys(linkValidationErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      // TODO: API call to create wishlist
      const validLinks = productLinks.filter(link => link.trim() !== '')
      console.log('Creating wishlist:', { ...formData, productLinks: validLinks })

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Redirect back to wishlists page
      router.push(`/${locale}/settings/wishlists`)
    } catch (error) {
      console.error('Failed to create wishlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push(`/${locale}/settings/wishlists`)
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
        />

        {/* Privacy Settings */}
        <PrivacySettings
          formData={formData}
          setFormData={setFormData}
        />

        {/* Action Buttons */}
        <FormActions onBack={handleBack} loading={loading} />
      </form>
    </div>
  )
}