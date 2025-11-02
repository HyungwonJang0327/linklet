import { NextResponse } from 'next/server'
import { extractUrlMetadata, type ProductMetadata } from '@/lib/services/url-metadata'

// Rate limiting simple implementation
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10 // 10 requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(ip)

  if (!userLimit) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (now > userLimit.resetTime) {
    // Reset the limit
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  userLimit.count++
  return true
}

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(/, /)[0]?.trim() : 'unknown'

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (error) {
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

    // Check if URL is from a supported domain (optional security measure)
    const hostname = parsedUrl.hostname?.toLowerCase() || ''
    const blockedDomains = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '10.',
      '192.168.',
      '172.'
    ]

    const isBlocked = blockedDomains.some(blocked =>
      hostname.includes(blocked) || hostname.startsWith(blocked)
    )

    if (isBlocked) {
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

// Handle preflight requests for CORS if needed
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}