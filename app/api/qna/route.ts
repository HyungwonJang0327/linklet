import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db/client'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'

// GET /api/qna - Get user's questions
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const qnas = await prisma.qnA.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ qnas })
  } catch (error) {
    console.error('[QnA API] Error fetching questions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    )
  }
}

// POST /api/qna - Submit a new question
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Rate limiting to prevent spam
    const clientIp = getClientIp(request)
    if (!checkRateLimit(`qna:${clientIp}`, RATE_LIMITS.INQUIRY)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { question } = body

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    if (question.length > 2000) {
      return NextResponse.json(
        { error: 'Question is too long (max 2000 characters)' },
        { status: 400 }
      )
    }

    const qna = await prisma.qnA.create({
      data: {
        question: question.trim(),
        userId: session.user.id,
        status: 'pending'
      }
    })

    return NextResponse.json({ qna }, { status: 201 })
  } catch (error) {
    console.error('[QnA API] Error creating question:', error)
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    )
  }
}
