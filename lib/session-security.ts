import { prisma } from '@/lib/db/client'

/**
 * Session security utilities for detecting and preventing token theft
 */

interface SessionSecurityCheck {
  isValid: boolean
  reason?: string
  shouldRevoke?: boolean
}

/**
 * Check if session is being used from a suspicious location/device
 * Returns false if:
 * - IP address changed significantly (different country)
 * - User-Agent changed (different browser/device)
 * - Multiple concurrent sessions from different IPs
 */
export async function checkSessionSecurity(
  sessionToken: string,
  currentIp: string,
  currentUserAgent: string
): Promise<SessionSecurityCheck> {
  try {
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      select: {
        id: true,
        userId: true,
        // These fields would need to be added to schema
        // ipAddress: true,
        // userAgent: true,
        // lastUsedIp: true,
      }
    })

    if (!session) {
      return { isValid: false, reason: 'Session not found' }
    }

    // TODO: Implement after schema update
    // Example checks:

    // 1. IP Address Change Detection
    // if (session.ipAddress && session.ipAddress !== currentIp) {
    //   const originalCountry = await getCountryFromIP(session.ipAddress)
    //   const currentCountry = await getCountryFromIP(currentIp)
    //
    //   if (originalCountry !== currentCountry) {
    //     return {
    //       isValid: false,
    //       reason: 'Session used from different country',
    //       shouldRevoke: true
    //     }
    //   }
    // }

    // 2. User-Agent Change Detection
    // if (session.userAgent && session.userAgent !== currentUserAgent) {
    //   return {
    //     isValid: false,
    //     reason: 'Session used from different device/browser',
    //     shouldRevoke: true
    //   }
    // }

    // 3. Concurrent Session Detection
    const activeSessions = await prisma.session.count({
      where: {
        userId: session.userId,
        expires: { gt: new Date() }
      }
    })

    // If user has more than 5 active sessions, it's suspicious
    if (activeSessions > 5) {
      return {
        isValid: false,
        reason: 'Too many concurrent sessions',
        shouldRevoke: false  // Don't auto-revoke, just alert
      }
    }

    return { isValid: true }
  } catch (error) {
    console.error('Session security check error:', error)
    return { isValid: true }  // Fail open for availability
  }
}

/**
 * Get all active sessions for a user
 * Useful for "Active Sessions" page in settings
 */
export async function getUserActiveSessions(userId: string) {
  return await prisma.session.findMany({
    where: {
      userId,
      expires: { gt: new Date() }
    },
    select: {
      id: true,
      sessionToken: true,
      expires: true,
      // ipAddress: true,
      // userAgent: true,
      // lastUsedAt: true,
    },
    orderBy: {
      expires: 'desc'
    }
  })
}

/**
 * Revoke a specific session by ID
 */
export async function revokeSession(sessionId: string, userId: string) {
  return await prisma.session.deleteMany({
    where: {
      id: sessionId,
      userId  // Ensure user can only revoke their own sessions
    }
  })
}

/**
 * Update session metadata on each request
 * Call this in middleware or auth helper
 */
export async function updateSessionMetadata(
  sessionToken: string,
  ip: string,
  userAgent: string
) {
  // TODO: Implement after schema update
  // await prisma.session.update({
  //   where: { sessionToken },
  //   data: {
  //     lastUsedAt: new Date(),
  //     lastUsedIp: ip,
  //   }
  // })
}

/**
 * Delete all expired sessions from database
 * Should be run periodically (e.g., daily cron job)
 */
export async function deleteExpiredSessions() {
  const result = await prisma.session.deleteMany({
    where: {
      expires: {
        lt: new Date()  // expires < now()
      }
    }
  })

  return {
    deletedCount: result.count,
    deletedAt: new Date()
  }
}
