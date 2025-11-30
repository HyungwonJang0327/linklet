/**
 * Validates if a string is a valid HTTP/HTTPS URL
 *
 * @param string - The string to validate
 * @returns True if the string is a valid URL, false otherwise
 */
export function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string)

    // Only allow http and https protocols
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false
    }

    // URL length limit (2000 characters)
    if (string.length > 2000) {
      return false
    }

    // Minimum hostname length check (at least "a.co")
    if (url.hostname.length < 4) {
      return false
    }

    // TLD (Top Level Domain) required check
    const parts = url.hostname.split('.')
    if (parts.length < 2) {
      return false
    }

    // TLD minimum length check (at least 2 characters)
    const tld = parts[parts.length - 1]
    if (tld.length < 2) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Validates multiple URLs and returns validation results
 *
 * @param urls - Array of URL strings to validate
 * @returns Object with valid and invalid URLs
 */
export function validateUrls(urls: string[]): {
  valid: string[]
  invalid: { url: string; index: number }[]
} {
  const valid: string[] = []
  const invalid: { url: string; index: number }[] = []

  urls.forEach((url, index) => {
    const trimmedUrl = url.trim()
    if (trimmedUrl) {
      if (isValidUrl(trimmedUrl)) {
        valid.push(trimmedUrl)
      } else {
        invalid.push({ url: trimmedUrl, index })
      }
    }
  })

  return { valid, invalid }
}

/**
 * Checks for duplicate URLs in an array
 *
 * @param urls - Array of URL strings
 * @returns Array of indices with duplicate URLs
 */
export function findDuplicateUrls(urls: string[]): number[] {
  const seen = new Set<string>()
  const duplicates: number[] = []

  urls.forEach((url, index) => {
    const trimmedUrl = url.trim()
    if (trimmedUrl) {
      if (seen.has(trimmedUrl)) {
        duplicates.push(index)
      } else {
        seen.add(trimmedUrl)
      }
    }
  })

  return duplicates
}
