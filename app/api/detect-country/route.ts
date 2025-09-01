import { NextRequest, NextResponse } from 'next/server'

// Extend NextRequest to include geo and ip properties that may exist
interface ExtendedNextRequest extends NextRequest {
  geo?: {
    country?: string
    region?: string
    city?: string
  }
  ip?: string
}

export async function GET(request: NextRequest) {
  try {
    // Cast to extended interface
    const req = request as ExtendedNextRequest
    
    // Get IP address from various headers
    const forwardedFor = req.headers.get('x-forwarded-for')
    const realIP = req.headers.get('x-real-ip')
    const cfConnectingIP = req.headers.get('cf-connecting-ip')
    
    // Priority order: CF-Connecting-IP > X-Forwarded-For > X-Real-IP
    const clientIP = cfConnectingIP || 
                   (forwardedFor ? forwardedFor.split(',')[0].trim() : null) ||
                   realIP ||
                   req.ip ||
                   'unknown'

    // Check if we have geo data from the platform (Vercel/Cloudflare)
    let country = req.geo?.country
    
    if (!country && clientIP && clientIP !== 'unknown' && !isLocalIP(clientIP)) {
      // Fallback to IP geolocation API
      try {
        const geoResponse = await fetch(`https://ipapi.co/${clientIP}/json/`, {
          headers: {
            'User-Agent': 'Linklet/1.0'
          }
        })
        
        if (geoResponse.ok) {
          const geoData: { country_code?: string } = await geoResponse.json()
          country = geoData.country_code
        }
      } catch (geoError) {
        console.error('IP geolocation failed:', geoError)
      }
    }

    // Fallback to Accept-Language header for locale detection
    if (!country) {
      const acceptLanguage = req.headers.get('accept-language') || ''
      const primaryLanguage = acceptLanguage.split(',')[0].split('-')[0].toLowerCase()
      
      const languageToCountry: Record<string, string> = {
        'ko': 'KR',
        'ja': 'JP',
        'en': 'US'
      }
      
      country = languageToCountry[primaryLanguage] || 'US'
    }

    return NextResponse.json({
      country: country || 'US',
      ip: clientIP,
      userAgent: req.headers.get('user-agent'),
      acceptLanguage: req.headers.get('accept-language'),
      // Debug info (remove in production)
      debug: {
        forwardedFor,
        realIP,
        cfConnectingIP,
        geo: req.geo
      }
    })

  } catch (error: unknown) {
    console.error('Error detecting country:', error)
    
    return NextResponse.json({
      country: 'US', // Default fallback
      error: 'Failed to detect country',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Helper function to check if IP is local/private
function isLocalIP(ip: string): boolean {
  const localPatterns = [
    /^127\./,           // 127.x.x.x (localhost)
    /^192\.168\./,      // 192.168.x.x (private)
    /^10\./,            // 10.x.x.x (private)
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // 172.16.x.x - 172.31.x.x (private)
    /^::1$/,            // IPv6 localhost
    /^localhost$/i
  ]
  
  return localPatterns.some(pattern => pattern.test(ip))
}