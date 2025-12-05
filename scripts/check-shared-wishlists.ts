import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // shareUrl이 있는 위시리스트 조회
  const wishlists = await prisma.wishlist.findMany({
    where: {
      shareUrl: {
        not: null
      },
      isPublic: true
    },
    select: {
      id: true,
      title: true,
      shareUrl: true,
      customization: true,
      _count: {
        select: {
          items: true
        }
      }
    },
    take: 5
  })

  console.log('\n📋 공유 가능한 위시리스트:')
  console.log('='.repeat(60))

  if (wishlists.length === 0) {
    console.log('❌ 공유 URL이 있는 위시리스트가 없습니다.')
    console.log('\n💡 해결 방법:')
    console.log('1. http://localhost:3003에 접속')
    console.log('2. 로그인 후 위시리스트 생성')
    console.log('3. 위시리스트 상세 페이지에서 공유 URL 생성')
  } else {
    wishlists.forEach((wishlist, index) => {
      console.log(`\n${index + 1}. ${wishlist.title}`)
      console.log(`   ID: ${wishlist.id}`)
      console.log(`   아이템 수: ${wishlist._count.items}`)
      console.log(`   커스터마이징: ${wishlist.customization ? '설정됨' : '기본값'}`)
      console.log(`   🔗 공유 URL: http://localhost:3003/w/${wishlist.shareUrl}`)
    })

    console.log('\n' + '='.repeat(60))
    console.log('✅ 위 URL 중 하나로 브라우저에서 접속하여 테스트하세요!')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
