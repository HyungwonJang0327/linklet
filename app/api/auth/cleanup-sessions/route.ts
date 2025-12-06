import { NextResponse } from 'next/server'
import { deleteExpiredSessions } from '@/lib/session-security'

/**
 * Delete all expired sessions from the database
 *
 * This endpoint should be called periodically (e.g., daily cron job)
 * to keep the sessions table clean and maintain database performance.
 *
 * Security: Protected by secret token to prevent unauthorized cleanup
 *
 * Usage:
 * - Manual: POST /api/auth/cleanup-sessions?token=YOUR_SECRET
 * - Cron job: curl -X POST "https://your-domain.com/api/auth/cleanup-sessions?token=YOUR_SECRET"
 */
export async function POST(request: Request) {
  try {
    // Verify secret token for security
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token || token !== process.env.REVALIDATE_SECRET_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing token' },
        { status: 401 }
      )
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
