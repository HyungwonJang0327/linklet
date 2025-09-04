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
    const ip = forwarded ? forwarded.split(/, /)[0] : 'unknown'

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Check if URL is from a supported domain (optional security measure)
    const hostname = new URL(url).hostname.toLowerCase()
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
    const result = await extractUrlMetadata(url)

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to extract metadata' 
        },
        { status: 400 }
      )
    }

    // Return successful result
    return NextResponse.json({
      success: true,
      data: result.data
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