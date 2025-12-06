import { NextRequest, NextResponse } from 'next/server'

// Extend NextRequest to include geo properties that may exist
interface ExtendedNextRequest extends NextRequest {
  geo?: {
    country?: string
    region?: string
    city?: string
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Cast to extended interface
  const req = request as ExtendedNextRequest

  // Check authentication for settings routes
  if (pathname.match(/^\/(kr|en|jp)\/settings/)) {
    // Check for session cookie
    const sessionToken = request.cookies.get('next-auth.session-token')?.value ||
                        request.cookies.get('__Secure-next-auth.session-token')?.value

    if (!sessionToken) {
      // Extract locale from pathname
      const locale = pathname.split('/')[1]
      const loginUrl = new URL(`/${locale}/login`, request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Only apply geo detection to wishlist sharing routes
  if (pathname.startsWith('/w/')) {
    // Get country from various sources
    let country = req.geo?.country

    if (!country) {
      // Fallback to IP-based detection or Accept-Language
      const acceptLanguage = req.headers.get('accept-language') || ''
      const primaryLanguage = acceptLanguage.split(',')[0].split('-')[0].toLowerCase()

      const languageToCountry: Record<string, string> = {
        'ko': 'KR',
        'ja': 'JP'
      }

      country = languageToCountry[primaryLanguage] || 'US'
    }

    // Add country header for the page to use
    const response = NextResponse.next()
    response.headers.set('x-user-country', country || 'US')

    return response
  }

  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/w/:path*',  // Wishlist sharing routes
    '/(kr|en|jp)/settings/:path*'  // Settings routes (all locales)
  ]
}