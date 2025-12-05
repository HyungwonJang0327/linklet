import { PrismaClient } from '@prisma/client'
import { createId } from '@paralleldrive/cuid2'

const prisma = new PrismaClient()

// 짧은 ID 생성 (10자)
function generateShortId(): string {
  return createId().substring(0, 10)
}

async function main() {
  console.log('\n🔧 ShareURL 정리 시작...\n')

  // 모든 위시리스트 조회
  const wishlists = await prisma.wishlist.findMany({
    where: {
      shareUrl: {
        not: null
      }
    },
    select: {
      id: true,
      title: true,
      shareUrl: true
    }
  })

  console.log(`총 ${wishlists.length}개의 위시리스트 발견\n`)

  for (const wishlist of wishlists) {
    const oldShareUrl = wishlist.shareUrl!
    let newShareUrl = oldShareUrl

    // /w/ 가 포함된 경우 제거
    if (oldShareUrl.includes('/')) {
      newShareUrl = oldShareUrl.replace(/^w\//, '').replace(/\/w\//, '')
      console.log(`❌ 잘못된 형식: ${oldShareUrl}`)
    }

    // 길이가 20자 이상이면 짧게 변경
    if (newShareUrl.length > 15) {
      newShareUrl = generateShortId()
      console.log(`📏 길이 조정: ${oldShareUrl} (${oldShareUrl.length}자)`)
    }

    // 변경이 필요한 경우 업데이트
    if (newShareUrl !== oldShareUrl) {
      await prisma.wishlist.update({
        where: { id: wishlist.id },
        data: { shareUrl: newShareUrl }
      })
      console.log(`✅ "${wishlist.title}": ${oldShareUrl} → ${newShareUrl}\n`)
    } else {
      console.log(`✓ "${wishlist.title}": ${oldShareUrl} (변경 없음)\n`)
    }
  }

  // 최종 결과 출력
  console.log('\n' + '='.repeat(60))
  console.log('✅ ShareURL 정리 완료!\n')

  const updatedWishlists = await prisma.wishlist.findMany({
    where: {
      shareUrl: {
        not: null
      },
      isPublic: true
    },
    select: {
      title: true,
      shareUrl: true
    },
    take: 10
  })

  console.log('📋 업데이트된 공유 URL 목록:')
  console.log('='.repeat(60))
  updatedWishlists.forEach((w, i) => {
    console.log(`${i + 1}. ${w.title}`)
    console.log(`   🔗 http://localhost:3003/w/${w.shareUrl}`)
  })
  console.log('='.repeat(60) + '\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
