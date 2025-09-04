export interface ProductMetadata {
  title?: string
  description?: string
  imageUrl?: string
  price?: string
  siteName?: string
  url: string
}

export interface MetadataExtractionResult {
  success: boolean
  data?: ProductMetadata
  error?: string
}

/**
 * Extracts metadata from a product URL by parsing HTML
 * Supports Open Graph, Twitter Cards, and common e-commerce meta tags
 */
export async function extractUrlMetadata(url: string): Promise<MetadataExtractionResult> {
  try {
    // Validate URL
    new URL(url) // This throws if URL is invalid
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Linklet Bot; +https://linklet.app)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('text/html')) {
      throw new Error('URL does not point to an HTML page')
    }

    const html = await response.text()
    const metadata = parseHtmlMetadata(html, url)

    return {
      success: true,
      data: metadata
    }
  } catch (error) {
    console.error('Metadata extraction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract metadata'
    }
  }
}

/**
 * Parses HTML content to extract product metadata
 */
function parseHtmlMetadata(html: string, url: string): ProductMetadata {
  const metadata: ProductMetadata = { url }

  // Create a simple parser for meta tags
  const metaTags = extractMetaTags(html)
  const title = extractTitle(html)

  // Extract title (priority: og:title > twitter:title > title tag)
  metadata.title = 
    metaTags['og:title'] ||
    metaTags['twitter:title'] ||
    metaTags['title'] ||
    title ||
    undefined

  // Extract description (priority: og:description > twitter:description > meta description)
  metadata.description = 
    metaTags['og:description'] ||
    metaTags['twitter:description'] ||
    metaTags['description'] ||
    undefined

  // Extract image (priority: og:image > twitter:image)
  let imageUrl = metaTags['og:image'] || metaTags['twitter:image']
  if (imageUrl) {
    // Handle relative URLs
    if (imageUrl.startsWith('//')) {
      imageUrl = 'https:' + imageUrl
    } else if (imageUrl.startsWith('/')) {
      const baseUrl = new URL(url)
      imageUrl = baseUrl.origin + imageUrl
    } else if (!imageUrl.startsWith('http')) {
      const baseUrl = new URL(url)
      imageUrl = new URL(imageUrl, baseUrl).href
    }
    metadata.imageUrl = imageUrl
  }

  // Extract price (common e-commerce patterns)
  metadata.price = extractPrice(html, metaTags)

  // Extract site name
  metadata.siteName = 
    metaTags['og:site_name'] ||
    metaTags['twitter:site'] ||
    new URL(url).hostname ||
    undefined

  // Clean up extracted data
  if (metadata.title) {
    metadata.title = cleanText(metadata.title)
  }
  if (metadata.description) {
    metadata.description = cleanText(metadata.description)
  }

  return metadata
}

/**
 * Extracts meta tags from HTML
 */
function extractMetaTags(html: string): Record<string, string> {
  const metaTags: Record<string, string> = {}
  
  // Match meta tags with property or name attributes
  const metaRegex = /<meta\s+(?:property|name|itemprop)=["']([^"']+)["']\s+content=["']([^"']*)["'][^>]*>/gi
  const metaRegex2 = /<meta\s+content=["']([^"']*)["']\s+(?:property|name|itemprop)=["']([^"']+)["'][^>]*>/gi
  
  let match
  while ((match = metaRegex.exec(html)) !== null) {
    const key = match[1].toLowerCase()
    const content = match[2]
    if (content.trim()) {
      metaTags[key] = content.trim()
    }
  }
  
  while ((match = metaRegex2.exec(html)) !== null) {
    const content = match[1]
    const key = match[2].toLowerCase()
    if (content.trim()) {
      metaTags[key] = content.trim()
    }
  }

  return metaTags
}

/**
 * Extracts title from title tag
 */
function extractTitle(html: string): string | null {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  return titleMatch ? titleMatch[1].trim() : null
}

/**
 * Extracts price information from HTML and meta tags
 */
function extractPrice(html: string, metaTags: Record<string, string>): string | undefined {
  // Check structured data first
  if (metaTags['product:price:amount']) {
    const currency = metaTags['product:price:currency'] || ''
    return `${currency} ${metaTags['product:price:amount']}`.trim()
  }

  // Check common price patterns in HTML
  const pricePatterns = [
    /["']price["']\s*:\s*["']([^"']+)["']/i,
    /price["\s]*[:=]\s*["']?([0-9,]+\.?[0-9]*)\s*[₩$€£¥]?/i,
    /[₩$€£¥]\s*([0-9,]+\.?[0-9]*)/,
    /([0-9,]+\.?[0-9]*)\s*[₩$€£¥]/,
    /price[^>]*>([^<]*[0-9][^<]*)</i
  ]

  for (const pattern of pricePatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return undefined
}

/**
 * Cleans and normalizes extracted text
 */
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&') // Replace &amp; with &
    .replace(/&lt;/g, '<') // Replace &lt; with <
    .replace(/&gt;/g, '>') // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#39;/g, "'") // Replace &#39; with '
    .trim()
}