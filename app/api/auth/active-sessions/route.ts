import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { getUserActiveSessions } from '@/lib/session-security'

/**
 * Get all active sessions for the current user
 * Used in Settings > Security page
 */
export async function GET() {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const sessions = await getUserActiveSessions(auth.session!.user.id)

    // Format sessions for display
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      // Don't send full sessionToken for security
      tokenPreview: session.sessionToken.substring(0, 8) + '...',
      expiresAt: session.expires,
      // ipAddress: session.ipAddress,
      // userAgent: session.userAgent,
      // lastUsedAt: session.lastUsedAt,
    }))

    return NextResponse.json({
      sessions: formattedSessions,
      count: sessions.length
    })
  } catch (error) {
    console.error('Error fetching active sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}
