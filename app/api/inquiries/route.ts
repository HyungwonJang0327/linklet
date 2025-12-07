import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db/client'

// GET - 사용자의 문의/피드백 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || undefined
    const status = searchParams.get('status') || undefined

    const where: any = { userId: session.user.id }
    if (type) where.type = type
    if (status) where.status = status

    const inquiries = await prisma.userInquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        subject: true,
        content: true,
        response: true,
        status: true,
        priority: true,
        category: true,
        createdAt: true,
        respondedAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(inquiries)
  } catch (error) {
    console.error('[Inquiries API] Error fetching inquiries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inquiries' },
      { status: 500 }
    )
  }
}

// POST - 새로운 문의/피드백 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, subject, content, priority, category } = body

    if (!subject || !content) {
      return NextResponse.json(
        { error: 'Subject and content are required' },
        { status: 400 }
      )
    }

    const inquiry = await prisma.userInquiry.create({
      data: {
        type: type || 'QUESTION',
        subject,
        content,
        priority,
        category,
        userId: session.user.id
      }
    })

    return NextResponse.json(inquiry, { status: 201 })
  } catch (error) {
    console.error('[Inquiries API] Error creating inquiry:', error)
    return NextResponse.json(
      { error: 'Failed to create inquiry' },
      { status: 500 }
    )
  }
}
