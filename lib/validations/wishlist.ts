import { WishlistCategory } from '@prisma/client'

export interface WishlistFormData {
  title: string
  description?: string
  isPublic?: boolean
  category?: string
}

export interface WishlistItemFormData {
  title: string
  description?: string
  productUrl: string
  imageUrl?: string
  price?: string
  priority?: number
}

export function validateWishlistForm(data: WishlistFormData): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  // Title validation
  if (!data.title || !data.title.trim()) {
    errors.title = 'Wishlist title is required'
  } else if (data.title.trim().length < 2) {
    errors.title = 'Title must be at least 2 characters long'
  } else if (data.title.trim().length > 100) {
    errors.title = 'Title must be 100 characters or less'
  }

  // Description validation
  if (data.description && data.description.length > 500) {
    errors.description = 'Description must be 500 characters or less'
  }

  // Category validation
  if (data.category && !isValidWishlistCategory(data.category)) {
    errors.category = 'Invalid category selected'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export function validateWishlistItemForm(data: WishlistItemFormData): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  // Title validation
  if (!data.title || !data.title.trim()) {
    errors.title = 'Item title is required'
  } else if (data.title.trim().length < 1) {
    errors.title = 'Title must be at least 1 character long'
  } else if (data.title.trim().length > 200) {
    errors.title = 'Title must be 200 characters or less'
  }

  // Product URL validation
  if (!data.productUrl || !data.productUrl.trim()) {
    errors.productUrl = 'Product URL is required'
  } else if (!isValidUrl(data.productUrl.trim())) {
    errors.productUrl = 'Please enter a valid URL'
  }

  // Description validation
  if (data.description && data.description.length > 1000) {
    errors.description = 'Description must be 1000 characters or less'
  }

  // Image URL validation
  if (data.imageUrl && data.imageUrl.trim() && !isValidUrl(data.imageUrl.trim())) {
    errors.imageUrl = 'Please enter a valid image URL'
  }

  // Price validation
  if (data.price && data.price.length > 50) {
    errors.price = 'Price must be 50 characters or less'
  }

  // Priority validation
  if (data.priority !== undefined && (data.priority < 0 || data.priority > 9999)) {
    errors.priority = 'Priority must be between 0 and 9999'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function isValidWishlistCategory(category: string): category is keyof typeof WishlistCategory {
  return Object.values(WishlistCategory).includes(category as WishlistCategory)
}

export function sanitizeWishlistData(data: WishlistFormData) {
  return {
    title: data.title.trim(),
    description: data.description?.trim() || undefined,
    isPublic: data.isPublic ?? true,
    category: data.category && isValidWishlistCategory(data.category) 
      ? (data.category as WishlistCategory) 
      : WishlistCategory.GENERAL
  }
}

export function sanitizeWishlistItemData(data: WishlistItemFormData) {
  return {
    title: data.title.trim(),
    description: data.description?.trim() || undefined,
    productUrl: data.productUrl.trim(),
    imageUrl: data.imageUrl?.trim() || undefined,
    price: data.price?.trim() || undefined,
    priority: data.priority ?? 0
  }
}

export function extractDomainFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return null
  }
}

export function generateShareableUrl(shareUrl: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/${shareUrl}`
}