import * as cheerio from 'cheerio'

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
 * Extracts metadata from a product URL by parsing HTML using Cheerio
 * Supports Open Graph, Twitter Cards, JSON-LD, and common e-commerce meta tags
 * Includes retry logic for improved reliability
 */
export async function extractUrlMetadata(url: string, retryCount = 0): Promise<MetadataExtractionResult> {
  const MAX_RETRIES = 2

  try {
    // Validate URL format and structure
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      throw new Error('Invalid URL format')
    }

    // Additional URL validation
    if (!parsedUrl.protocol.startsWith('http')) {
      throw new Error('Only HTTP and HTTPS URLs are supported')
    }

    if (!parsedUrl.hostname || parsedUrl.hostname.length < 3) {
      throw new Error('Invalid hostname')
    }

    // Check if hostname has at least one dot (domain.tld format)
    if (!parsedUrl.hostname.includes('.') || parsedUrl.hostname.endsWith('.')) {
      throw new Error('Invalid domain format')
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'no-cache',
      },
      // Add timeout with exponential backoff
      signal: AbortSignal.timeout(15000 + (retryCount * 5000)), // 15s, 20s, 25s
      redirect: 'follow', // Follow redirects automatically
    })

    if (!response.ok) {
      // Retry on 5xx errors or rate limiting
      if ((response.status >= 500 || response.status === 429) && retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))) // Wait 1s, 2s
        return extractUrlMetadata(url, retryCount + 1)
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('text/html')) {
      throw new Error('URL does not point to an HTML page')
    }

    const html = await response.text()
    const metadata = parseHtmlMetadata(html, url)

    // Validate that we extracted at least some meaningful data
    if (!metadata.title && !metadata.description && !metadata.imageUrl) {
      // Retry if we got nothing useful and haven't exceeded retry limit
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
        return extractUrlMetadata(url, retryCount + 1)
      }
    }

    return {
      success: true,
      data: metadata
    }
  } catch (error) {
    console.error('Metadata extraction error:', error)

    // Retry on timeout or network errors
    if (retryCount < MAX_RETRIES && (
      error instanceof TypeError || // Network errors
      (error instanceof Error && error.name === 'AbortError') // Timeout errors
    )) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
      return extractUrlMetadata(url, retryCount + 1)
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract metadata'
    }
  }
}

/**
 * Parses HTML content to extract product metadata using Cheerio
 */
function parseHtmlMetadata(html: string, url: string): ProductMetadata {
  const $ = cheerio.load(html)
  const metadata: ProductMetadata = { url }

  // Extract title (multiple fallbacks for better success rate)
  metadata.title =
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    $('meta[name="title"]').attr('content') ||
    $('[itemprop="name"]').first().text() || // Schema.org Product name
    $('h1[class*="product"]').first().text() || // Product-specific h1
    $('h1[class*="title"]').first().text() ||
    $('title').text() ||
    $('h1').first().text() ||
    $('.product-name').first().text() ||
    $('.product-title').first().text() ||
    undefined

  // Extract description (multiple fallbacks)
  metadata.description =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="twitter:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    $('[itemprop="description"]').first().text() || // Schema.org description
    $('.product-description').first().text() ||
    undefined

  // Extract image (enhanced with multiple sources and high-res preference)
  let imageUrl =
    $('meta[property="og:image"]').attr('content') ||
    $('meta[property="og:image:secure_url"]').attr('content') || // Prefer secure URLs
    $('meta[name="twitter:image"]').attr('content') ||
    $('meta[name="twitter:image:src"]').attr('content') ||
    $('[itemprop="image"]').attr('content') || // Schema.org image
    $('link[rel="image_src"]').attr('href') || // Link rel image
    extractBestImageFromSrcset($('img[class*="product"][class*="main"]').first()) ||
    extractBestImageFromSrcset($('img[class*="product"][class*="image"]').first()) ||
    $('img[class*="product"][class*="main"]').first().attr('src') || // Main product image
    $('img[class*="product"][class*="image"]').first().attr('src') ||
    $('img.product-image').first().attr('src') ||
    $('.product-img img').first().attr('src') ||
    $('img[alt][src*="product"]').first().attr('src') || // Product-related images
    extractBestImageFromSrcset($('img[alt]').first()) ||
    $('img[alt]').first().attr('src') || // Fallback to first img with alt
    $('img').first().attr('src') || // Last resort: first image
    undefined

  if (imageUrl) {
    imageUrl = resolveUrl(imageUrl, url)
    metadata.imageUrl = imageUrl
  }

  // Extract price using various methods
  metadata.price = extractPrice($)

  // Extract site name
  metadata.siteName =
    $('meta[property="og:site_name"]').attr('content') ||
    $('meta[name="twitter:site"]').attr('content')?.replace('@', '') ||
    $('meta[name="application-name"]').attr('content') ||
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
 * Extracts price information using Cheerio and various selectors
 */
function extractPrice($: cheerio.Root): string | undefined {
  // Check JSON-LD structured data first
  const jsonLdScripts = $('script[type="application/ld+json"]')
  for (let i = 0; i < jsonLdScripts.length; i++) {
    try {
      const jsonLdText = $(jsonLdScripts[i]).html()
      if (jsonLdText) {
        const jsonLd = JSON.parse(jsonLdText)
        const price = extractPriceFromJsonLd(jsonLd)
        if (price) return price
      }
    } catch {
      // Continue if JSON parsing fails
    }
  }

  // Check meta tags for price
  const priceFromMeta =
    $('meta[property="product:price:amount"]').attr('content') ||
    $('meta[name="price"]').attr('content') ||
    undefined

  if (priceFromMeta) {
    const currency = $('meta[property="product:price:currency"]').attr('content') || ''
    return currency ? `${currency} ${priceFromMeta}` : priceFromMeta
  }

  // Check common price selectors (expanded for better coverage)
  const priceSelectors = [
    // Schema.org
    '[itemprop="price"]',
    '[itemprop="lowPrice"]',
    '[itemprop="highPrice"]',
    // Standard price classes
    '.price',
    '.product-price',
    '.price-current',
    '.sale-price',
    '.regular-price',
    '.final-price',
    '.actual-price',
    '.amount',
    '.money',
    '.cost',
    // Korean e-commerce specific
    '.total_price', // Coupang
    '.price_num', // 11st
    '.price-value', // Gmarket
    '.sale_price', // Naver Shopping
    '.ProductPrice', // Various sites
    '.prod-price',
    '.item-price',
    // Attribute-based selectors
    '[data-price]',
    '[data-product-price]',
    '[data-sale-price]',
    // Class/ID wildcards (keep at end for lower priority)
    '[class*="price"]',
    '[id*="price"]',
    '[class*="Price"]',
    '[id*="Price"]'
  ]

  for (const selector of priceSelectors) {
    const priceElement = $(selector).first()
    if (priceElement.length > 0) {
      const priceText = priceElement.text().trim()
      if (priceText && /[0-9]/.test(priceText)) {
        return cleanPriceText(priceText)
      }
    }
  }

  // Check data attributes
  const dataPrice = $('[data-price]').first().attr('data-price')
  if (dataPrice) {
    return cleanPriceText(dataPrice)
  }

  return undefined
}

/**
 * Extracts price from JSON-LD structured data
 */
function extractPriceFromJsonLd(jsonLd: any): string | undefined {
  if (!jsonLd) return undefined

  // Handle arrays
  if (Array.isArray(jsonLd)) {
    for (const item of jsonLd) {
      const price = extractPriceFromJsonLd(item)
      if (price) return price
    }
    return undefined
  }

  // Check for Product type
  if (jsonLd['@type'] === 'Product' && jsonLd.offers) {
    const offers = Array.isArray(jsonLd.offers) ? jsonLd.offers[0] : jsonLd.offers
    if (offers.price && offers.priceCurrency) {
      return `${offers.priceCurrency} ${offers.price}`
    }
    if (offers.price) {
      return offers.price.toString()
    }
  }

  // Check for Offer type
  if (jsonLd['@type'] === 'Offer') {
    if (jsonLd.price && jsonLd.priceCurrency) {
      return `${jsonLd.priceCurrency} ${jsonLd.price}`
    }
    if (jsonLd.price) {
      return jsonLd.price.toString()
    }
  }

  return undefined
}

/**
 * Resolves relative URLs to absolute URLs
 */
function resolveUrl(relativeUrl: string, baseUrl: string): string {
  try {
    if (relativeUrl.startsWith('//')) {
      return 'https:' + relativeUrl
    } else if (relativeUrl.startsWith('/')) {
      const base = new URL(baseUrl)
      return base.origin + relativeUrl
    } else if (!relativeUrl.startsWith('http')) {
      return new URL(relativeUrl, baseUrl).href
    }
    return relativeUrl
  } catch {
    return relativeUrl
  }
}

/**
 * Cleans price text by extracting numbers and currency symbols
 */
function cleanPriceText(text: string): string {
  // Extract currency symbols and numbers
  const priceMatch = text.match(/([₩$€£¥¢]?)\s*([0-9,]+\.?[0-9]*)\s*([₩$€£¥¢]?)/i)
  if (priceMatch) {
    const currency = priceMatch[1] || priceMatch[3] || ''
    const amount = priceMatch[2]
    return currency ? `${currency}${amount}` : amount
  }

  // Fallback: return original text if it contains numbers
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * Extracts the highest resolution image from srcset attribute
 */
function extractBestImageFromSrcset(element: cheerio.Cheerio<cheerio.Element>): string | undefined {
  if (!element || element.length === 0) return undefined

  const srcset = element.attr('srcset')
  if (!srcset) return undefined

  try {
    // Parse srcset: "image1.jpg 1x, image2.jpg 2x" or "image1.jpg 300w, image2.jpg 600w"
    const sources = srcset.split(',').map(s => {
      const parts = s.trim().split(/\s+/)
      if (parts.length >= 2) {
        const url = parts[0]
        const descriptor = parts[1]
        // Extract numeric value from descriptor (e.g., "2x" -> 2, "600w" -> 600)
        const value = parseFloat(descriptor)
        return { url, value: isNaN(value) ? 1 : value }
      }
      return { url: parts[0], value: 1 }
    })

    // Sort by descriptor value (highest first) and return the best quality image
    sources.sort((a, b) => b.value - a.value)
    return sources[0]?.url
  } catch {
    return undefined
  }
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
    .replace(/\n|\r/g, ' ') // Replace newlines with space
    .trim()
}