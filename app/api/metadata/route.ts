import { NextResponse } from 'next/server'
import { extractUrlMetadata } from '@/lib/services/url-metadata'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

// Rate limit for metadata extraction: 10 requests per minute per IP
const METADATA_RATE_LIMIT = {
  limit: 10,
  windowMs: 60 * 1000 // 1 minute
}

export async function POST(request: Request) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request)
    if (!checkRateLimit(`metadata:${clientIp}`, METADATA_RATE_LIMIT)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { url } = body

    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json(
        { error: 'Valid URL is required' },
        { status: 400 }
      )
    }

    const trimmedUrl = url.trim()

    // Validate URL format
    let parsedUrl
    try {
      parsedUrl = new URL(trimmedUrl)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Additional URL validation
    if (!parsedUrl.protocol.startsWith('http')) {
      return NextResponse.json(
        { error: 'Only HTTP and HTTPS URLs are supported' },
        { status: 400 }
      )
    }

    // SSRF Protection: Block private IPs, localhost, and cloud metadata endpoints
    const hostname = parsedUrl.hostname?.toLowerCase() || ''

    // Check for blocked hostnames
    const blockedHostnames = [
      'localhost',
      'metadata.google.internal', // GCP metadata
      'instance-data', // AWS
      'metadata', // General metadata
    ]

    if (blockedHostnames.includes(hostname)) {
      return NextResponse.json(
        { error: 'URL not allowed for security reasons' },
        { status: 400 }
      )
    }

    // Check for IPv4 private ranges and cloud metadata
    const ipv4Patterns = [
      /^127\./,                    // Loopback
      /^0\./,                      // Current network
      /^10\./,                     // Private Class A
      /^172\.(1[6-9]|2\d|3[01])\./, // Private Class B (172.16.0.0 - 172.31.255.255)
      /^192\.168\./,               // Private Class C
      /^169\.254\./,               // Link-local / AWS metadata
      /^224\./,                    // Multicast
      /^255\.255\.255\.255$/,      // Broadcast
    ]

    // Check for IPv6 private ranges and localhost
    const ipv6Patterns = [
      /^::1$/,                     // IPv6 loopback
      /^::/,                       // IPv6 unspecified
      /^::ffff:127\./,             // IPv4-mapped IPv6 loopback
      /^fe80:/,                    // Link-local
      /^fc00:/,                    // Unique local addresses
      /^fd00:/,                    // Unique local addresses (subset)
      /^ff00:/,                    // Multicast
    ]

    const isBlockedIp = [...ipv4Patterns, ...ipv6Patterns].some(pattern =>
      pattern.test(hostname)
    )

    if (isBlockedIp) {
      return NextResponse.json(
        { error: 'URL not allowed for security reasons' },
        { status: 400 }
      )
    }

    // Extract metadata
    const result = await extractUrlMetadata(trimmedUrl)

    if (!result?.success) {
      return NextResponse.json(
        {
          success: false,
          error: result?.error || 'Failed to extract metadata'
        },
        { status: 400 }
      )
    }

    // Validate extracted data
    if (!result.data) {
      return NextResponse.json(
        {
          success: false,
          error: 'No metadata extracted'
        },
        { status: 400 }
      )
    }

    // Upload image to S3 if imageUrl exists
    let s3ImageUrl = result.data.imageUrl
    if (result.data.imageUrl) {
      try {
        // Fetch the image from the original URL
        const imageResponse = await fetch(result.data.imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        })

        if (imageResponse.ok) {
          const imageBlob = await imageResponse.blob()
          
          // Check if it's a valid image type
          if (imageBlob.type.startsWith('image/')) {
            // Create FormData for S3 upload using existing API
            const formData = new FormData()
            const fileName = `metadata-image-${Date.now()}.${imageBlob.type.split('/')[1] || 'jpg'}`
            formData.append('img', imageBlob, fileName)

            // Upload to S3 using existing /api/image endpoint
            const s3Response = await fetch(`${request.url.split('/api/')[0]}/api/image`, {
              method: 'POST',
              body: formData,
            })

            if (s3Response.ok) {
              const s3Result = await s3Response.json()
              if (s3Result.data && s3Result.data[0]) {
                s3ImageUrl = s3Result.data[0]
              }
            }
          }
        }
      } catch (error) {
        console.log('Failed to upload image to S3, using original URL:', error)
        // Keep the original imageUrl if S3 upload fails
      }
    }

    // Return successful result with sanitized data
    return NextResponse.json({
      success: true,
      data: {
        ...result.data,
        title: result.data.title?.trim() || undefined,
        description: result.data.description?.trim() || undefined,
        imageUrl: s3ImageUrl?.trim() || undefined,
        price: result.data.price?.trim() || undefined,
        siteName: result.data.siteName?.trim() || undefined,
        url: result.data.url?.trim() || trimmedUrl
      }
    })

  } catch (error) {
    console.error('Metadata extraction API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// Handle preflight requests for CORS
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin')
  const allowedOrigins = process.env.NEXT_PUBLIC_APP_URL
    ? [process.env.NEXT_PUBLIC_APP_URL]
    : ['http://localhost:3000']

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24 hours
  }

  // Only allow specific origins
  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Credentials'] = 'true'
  }

  return new NextResponse(null, {
    status: 204,
    headers,
  })
}