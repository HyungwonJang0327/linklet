import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db/client'

// GET /api/admin/qna - Get all questions with optional status filter
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const qnas = await prisma.qnA.findMany({
      where: status ? { status } : undefined,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ qnas })
  } catch (error) {
    console.error('[Admin QnA API] Error fetching questions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/qna - Update a question (answer or change status)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, answer, status } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      )
    }

    // Validate status if provided
    if (status && !['pending', 'answered', 'closed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: pending, answered, or closed' },
        { status: 400 }
      )
    }

    // Check if question exists
    const existingQnA = await prisma.qnA.findUnique({
      where: { id }
    })

    if (!existingQnA) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: {
      answer?: string | null
      status?: string
    } = {}

    if (answer !== undefined) {
      updateData.answer = answer ? answer.trim() : null
    }

    if (status) {
      updateData.status = status
    }

    // Automatically set status to 'answered' if answer is provided and status is 'pending'
    if (answer && existingQnA.status === 'pending' && !status) {
      updateData.status = 'answered'
    }

    const updatedQnA = await prisma.qnA.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({ qna: updatedQnA })
  } catch (error) {
    console.error('[Admin QnA API] Error updating question:', error)
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/qna - Delete a question
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      )
    }

    // Check if question exists
    const existingQnA = await prisma.qnA.findUnique({
      where: { id }
    })

    if (!existingQnA) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    await prisma.qnA.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin QnA API] Error deleting question:', error)
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    )
  }
}
