import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, shareUrl, secret } = body

    // 보안을 위한 시크릿 키 검증 (환경변수로 설정)
    const revalidateSecret = process.env.REVALIDATE_SECRET_TOKEN
    if (!revalidateSecret || secret !== revalidateSecret) {
      return NextResponse.json(
        { error: 'Invalid secret token' },
        { status: 401 }
      )
    }

    switch (type) {
      case 'wishlist':
        if (!shareUrl) {
          return NextResponse.json(
            { error: 'shareUrl is required for wishlist revalidation' },
            { status: 400 }
          )
        }

        // 해당 위시리스트가 실제 존재하는지 확인
        const wishlist = await prisma.wishlist.findFirst({
          where: { shareUrl }
        })

        if (!wishlist) {
          return NextResponse.json(
            { error: 'Wishlist not found' },
            { status: 404 }
          )
        }

        // 특정 공유 위시리스트 페이지 재검증
        revalidatePath(`/w/${shareUrl}`)
        revalidateTag(`wishlist-${shareUrl}`)

        return NextResponse.json({
          message: `Revalidated wishlist: ${shareUrl}`,
          timestamp: new Date().toISOString()
        })

      case 'all-wishlists':
        // 모든 위시리스트 관련 페이지 재검증
        revalidateTag('wishlists')
        
        return NextResponse.json({
          message: 'Revalidated all wishlists',
          timestamp: new Date().toISOString()
        })

      case 'path':
        const { path } = body
        if (!path) {
          return NextResponse.json(
            { error: 'path is required for path revalidation' },
            { status: 400 }
          )
        }

        revalidatePath(path)

        return NextResponse.json({
          message: `Revalidated path: ${path}`,
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json(
          { error: 'Invalid revalidation type. Use: wishlist, all-wishlists, or path' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}