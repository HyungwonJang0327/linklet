export interface UserProfileFormData {
  name?: string
  bio?: string
  avatar?: string
  locale?: string
}

export function validateUserProfileForm(data: UserProfileFormData): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  // Name validation
  if (data.name !== undefined) {
    if (data.name.length === 0) {
      errors.name = 'Name cannot be empty'
    } else if (data.name.length > 100) {
      errors.name = 'Name must be 100 characters or less'
    }
  }

  // Bio validation
  if (data.bio !== undefined && data.bio.length > 500) {
    errors.bio = 'Bio must be 500 characters or less'
  }

  // Avatar URL validation
  if (data.avatar && data.avatar.trim() && !isValidUrl(data.avatar.trim())) {
    errors.avatar = 'Please enter a valid avatar URL'
  }

  // Locale validation
  if (data.locale && !isValidLocale(data.locale)) {
    errors.locale = 'Invalid locale selected'
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

export function isValidLocale(locale: string): boolean {
  const validLocales = ['kr', 'en', 'jp']
  return validLocales.includes(locale)
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function sanitizeUserProfileData(data: UserProfileFormData) {
  return {
    name: data.name?.trim() || undefined,
    bio: data.bio?.trim() || undefined,
    avatar: data.avatar?.trim() || undefined,
    locale: data.locale && isValidLocale(data.locale) ? data.locale : undefined
  }
}

export function generateUserInitials(name?: string): string {
  if (!name) return '?'
  
  const words = name.trim().split(' ').filter(Boolean)
  if (words.length === 0) return '?'
  
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase()
  }
  
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
}