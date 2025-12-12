import { NextResponse } from 'next/server'
import { deleteExpiredSessions } from '@/lib/session-security'
import { requireAdmin } from '@/lib/auth-helpers'

/**
 * Delete all expired sessions from the database
 *
 * This endpoint should be called periodically (e.g., daily cron job)
 * to keep the sessions table clean and maintain database performance.
 *
 * Security: Protected by admin authentication
 *
 * Usage:
 * - Manual: POST /api/auth/cleanup-sessions (requires admin session)
 * - Cron job: Can use REVALIDATE_SECRET_TOKEN query parameter for automated jobs
 */
export async function POST(request: Request) {
  try {
    // Support both admin auth and secret token for cron jobs
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    // If token is provided, validate it (for cron jobs)
    if (token) {
      if (token !== process.env.REVALIDATE_SECRET_TOKEN) {
        return NextResponse.json(
          { error: 'Unauthorized - Invalid token' },
          { status: 401 }
        )
      }
    } else {
      // Otherwise require admin authentication
      const auth = await requireAdmin()
      if (auth.error) return auth.error
    }

    // Delete all expired sessions
    const result = await deleteExpiredSessions()

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} expired session(s)`,
      deletedCount: result.deletedCount,
      deletedAt: result.deletedAt
    })
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup sessions' },
      { status: 500 }
    )
  }
}
