/**
 * Simple in-memory rate limiter for analytics tracking
 * Prevents abuse from infinite refresh, bots, and stress tests
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (will be reset on server restart)
// For production, consider using Redis
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup interval: every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

interface RateLimitOptions {
  /**
   * Maximum number of requests allowed in the window
   */
  limit: number
  /**
   * Time window in milliseconds
   */
  windowMs: number
}

/**
 * Check if a request should be rate limited
 * @param identifier Unique identifier (e.g., "view:IP:wishlistId" or "click:IP:wishlistId")
 * @param options Rate limit configuration
 * @returns true if request should be allowed, false if rate limited
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  // No previous entry - allow and create new entry
  if (!entry) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + options.windowMs
    })
    return true
  }

  // Entry expired - reset and allow
  if (now > entry.resetAt) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + options.windowMs
    })
    return true
  }

  // Within window - check count
  if (entry.count >= options.limit) {
    return false // Rate limited
  }

  // Increment count and allow
  entry.count++
  return true
}

/**
 * Extract IP address from request headers
 * Checks x-forwarded-for, x-real-ip, and falls back to remoteAddress
 */
export function getClientIp(request: Request): string {
  const headers = request.headers

  // Check common proxy headers
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to a default if no IP can be determined
  return 'unknown'
}

/**
 * Check if User-Agent appears to be a bot
 * Basic bot detection - not foolproof but catches common bots
 */
export function isLikelyBot(userAgent: string | null): boolean {
  if (!userAgent) return true

  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /postman/i,
    /insomnia/i,
  ]

  return botPatterns.some(pattern => pattern.test(userAgent))
}

/**
 * Rate limit configurations for different analytics events
 */
export const RATE_LIMITS = {
  // View count: 1 per hour per IP per wishlist
  VIEW: {
    limit: 1,
    windowMs: 60 * 60 * 1000 // 1 hour
  },
  // Click count: 5 per 5 minutes per IP per wishlist (allows browsing multiple items)
  CLICK: {
    limit: 5,
    windowMs: 5 * 60 * 1000 // 5 minutes
  },
  // Shared wishlist viewing: 10 per minute per IP per shareUrl (prevents abuse while allowing normal usage)
  SHARED_WISHLIST: {
    limit: 10,
    windowMs: 60 * 1000 // 1 minute
  }
} as const
