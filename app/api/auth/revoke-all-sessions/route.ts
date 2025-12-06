import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db/client'

/**
 * Revoke all sessions for the current user
 * Use case: "Log out from all devices" or suspected token theft
 */
export async function POST(request: Request) {
  // Require authentication
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const userId = auth.session!.user.id

    // Delete ALL sessions for this user from database
    const result = await prisma.session.deleteMany({
      where: { userId }
    })

    return NextResponse.json({
      success: true,
      message: `${result.count} session(s) revoked. Please sign in again.`,
      revokedCount: result.count
    })
  } catch (error) {
    console.error('Error revoking sessions:', error)
    return NextResponse.json(
      { error: 'Failed to revoke sessions' },
      { status: 500 }
    )
  }
}
