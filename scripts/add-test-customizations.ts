import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 다양한 테스트 커스터마이징 데이터
const customizations = [
  {
    // Modern Blue - 기본
    theme: 'modern',
    layout: 'grid',
    colors: {
      primary: '#3b82f6',
      background: '#0f172a',
      text: '#ffffff',
      accent: '#6366f1'
    },
    profile: {
      displayName: 'My Wishlist',
      bio: '내가 원하는 상품들을 모아놓은 공간입니다',
      avatar: '',
      showItemCount: true,
      showCreatedDate: true
    },
    socialLinks: [
      { platform: 'instagram', url: 'https://instagram.com/myaccount', enabled: true },
      { platform: 'twitter', url: 'https://twitter.com/myaccount', enabled: true }
    ]
  },
  {
    // Gradient Theme - 리스트 레이아웃
    theme: 'gradient',
    layout: 'list',
    colors: {
      primary: '#ec4899',
      background: '#1e1b4b',
      text: '#ffffff',
      accent: '#f472b6'
    },
    profile: {
      displayName: 'Pink Gradient Wishlist',
      bio: '핑크 그라디언트 테마를 적용한 위시리스트',
      avatar: '',
      showItemCount: true,
      showCreatedDate: false
    },
    socialLinks: []
  },
  {
    // Minimal White - 메이슨리 레이아웃
    theme: 'minimal',
    layout: 'masonry',
    colors: {
      primary: '#3b82f6',
      background: '#ffffff',
      text: '#1f2937',
      accent: '#2563eb'
    },
    profile: {
      displayName: 'Minimal Clean',
      bio: '깔끔한 화이트 테마',
      avatar: '',
      showItemCount: false,
      showCreatedDate: false
    },
    socialLinks: []
  },
  {
    // Neon Purple - 캐러셀
    theme: 'neon',
    layout: 'carousel',
    colors: {
      primary: '#a855f7',
      background: '#000000',
      text: '#ffffff',
      accent: '#c084fc'
    },
    profile: {
      displayName: 'Neon Dreams',
      bio: '네온 퍼플 테마의 위시리스트',
      avatar: '',
      showItemCount: true,
      showCreatedDate: true
    },
    socialLinks: [
      { platform: 'youtube', url: 'https://youtube.com/@channel', enabled: true }
    ]
  },
  {
    // Nature Green
    theme: 'nature',
    layout: 'grid',
    colors: {
      primary: '#10b981',
      background: '#065f46',
      text: '#ffffff',
      accent: '#34d399'
    },
    profile: {
      displayName: 'Nature Lover',
      bio: '자연을 사랑하는 사람의 위시리스트',
      avatar: '',
      showItemCount: true,
      showCreatedDate: false
    },
    socialLinks: []
  }
]

async function main() {
  console.log('\n🎨 테스트 커스터마이징 데이터 추가 시작...\n')

  const wishlists = await prisma.wishlist.findMany({
    where: {
      shareUrl: { not: null },
      isPublic: true
    },
    select: {
      id: true,
      title: true,
      shareUrl: true
    },
    take: 5
  })

  if (wishlists.length === 0) {
    console.log('❌ 공유 가능한 위시리스트가 없습니다.')
    return
  }

  for (let i = 0; i < Math.min(wishlists.length, customizations.length); i++) {
    const wishlist = wishlists[i]
    const customization = customizations[i]

    await prisma.wishlist.update({
      where: { id: wishlist.id },
      data: {
        customization: customization as any
      }
    })

    console.log(`✅ "${wishlist.title}"`)
    console.log(`   테마: ${customization.theme}, 레이아웃: ${customization.layout}`)
    console.log(`   🔗 http://localhost:3003/w/${wishlist.shareUrl}\n`)
  }

  console.log('='.repeat(60))
  console.log('✅ 커스터마이징 데이터 추가 완료!')
  console.log('='.repeat(60))
  console.log('\n💡 위 URL로 접속하여 각기 다른 테마와 레이아웃을 확인하세요!\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
