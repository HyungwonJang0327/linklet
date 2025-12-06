import { NextResponse } from 'next/server'
import { createUser, getUserById, getUserByEmail, updateUser } from '@/lib/db/user'
import { requireAuth } from '@/lib/auth-helpers'

export async function GET(request: Request) {
  // Require authentication
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const email = searchParams.get('email')

    if (id) {
      // Users can only access their own data
      if (id !== auth.session!.user.id) {
        return NextResponse.json(
          { error: 'You can only access your own user data' },
          { status: 403 }
        )
      }

      const user = await getUserById(id)
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(user)
    }

    if (email) {
      // Users can only access their own data
      if (email !== auth.session!.user.email) {
        return NextResponse.json(
          { error: 'You can only access your own user data' },
          { status: 403 }
        )
      }

      const user = await getUserByEmail(email)
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(user)
    }

    return NextResponse.json(
      { error: 'User ID or email is required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { email, name, bio, avatar, locale } = await request.json()

    const user = await createUser({
      email,
      name,
      bio,
      avatar,
      locale
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  // Require authentication
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Users can only update their own data
    if (id !== auth.session!.user.id) {
      return NextResponse.json(
        { error: 'You can only update your own user data' },
        { status: 403 }
      )
    }

    const { name, bio, avatar, locale } = await request.json()

    const user = await updateUser(id, {
      name,
      bio,
      avatar,
      locale
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}