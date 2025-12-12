import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { requireAdmin } from '@/lib/auth-helpers'

// GET /api/notices - Get all published notices
export async function GET() {
  try {
    const notices = await prisma.notice.findMany({
      where: {
        isPublished: true,
      },
      orderBy: [
        {
          isPinned: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    })

    return NextResponse.json(notices)
  } catch (error) {
    console.error('Error fetching notices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notices' },
      { status: 500 }
    )
  }
}

// POST /api/notices - Create new notice (admin only)
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const auth = await requireAdmin()
    if (auth.error) return auth.error

    const body = await request.json()
    const { title, content, isPinned = false } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const notice = await prisma.notice.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        isPinned,
        isPublished: true,
      },
    })

    return NextResponse.json(notice, { status: 201 })
  } catch (error) {
    console.error('Error creating notice:', error)
    return NextResponse.json(
      { error: 'Failed to create notice' },
      { status: 500 }
    )
  }
}
