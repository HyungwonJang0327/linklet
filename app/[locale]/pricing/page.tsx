'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/lib/i18n/context'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'

export default function PricingPage() {
  const { t } = useI18n()
  const { locale = 'kr' } = useParams()
  const { user, isAuthenticated } = useAuth()
  const [isAnnual, setIsAnnual] = useState(false)

  // TODO: Replace with actual subscription status when subscription system is implemented
  // For now, we'll use a placeholder logic
  const userPlan = user ? 'pro' : 'free' // This would come from user.subscription?.plan or similar
  const isUserOnProPlan = userPlan === 'pro'

  const freePlan = {
    name: t('pricing.free.name') || 'Free',
    price: t('pricing.free.price') || '₩0',
    description: t('pricing.free.description') || '개인 사용자를 위한 기본 기능',
    features: [
      t('pricing.free.features.wishlists') || '최대 1개 위시리스트',
      t('pricing.free.features.items') || '위시리스트당 10개 아이템',
      t('pricing.free.features.sharing') || '링크 공유',
      t('pricing.free.features.categories') || '10개 카테고리',
      t('pricing.free.features.mobile') || '모바일 최적화'
    ]
  }

  const proPlan = {
    name: t('pricing.pro.name') || 'Pro',
    monthlyPrice: t('pricing.pro.monthlyPrice') || '₩9,900',
    annualPrice: t('pricing.pro.annualPrice') || '₩99,000',
    originalAnnualPrice: t('pricing.pro.originalAnnualPrice') || '₩118,800',
    description: t('pricing.pro.description') || '파워 유저를 위한 고급 기능',
    badge: t('pricing.pro.badge') || 'Most Popular',
    features: [
      t('pricing.pro.features.wishlists') || '무제한 위시리스트',
      // t('pricing.pro.features.sharing') || '고급 공유 옵션',
      t('pricing.pro.features.categories') || '무제한 카테고리',
      t('pricing.pro.features.customLogo') || '하단 로고 커스텀',
      t('pricing.pro.features.recommendations') || '🤖 AI 기반 선물 추천',
      t('pricing.pro.features.customization') || '🎨 완전한 테마 커스터마이징',
      t('pricing.pro.features.analytics') || '📊 위시리스트 분석 및 인사이트',
      t('pricing.pro.features.priority') || '⚡ 우선 지원',
      // t('pricing.pro.features.export') || '📤 데이터 내보내기'
    ]
  }

  const currentProPrice = isAnnual ? proPlan.annualPrice : proPlan.monthlyPrice

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            {t('pricing.title') || '요금제'}
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
            {t('pricing.subtitle') || '필요에 맞는 요금제를 선택하고 위시리스트 관리를 시작하세요'}
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm ${!isAnnual ? 'text-white' : 'text-slate-400'}`}>
              {t('pricing.monthly') || '월간'}
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAnnual ? 'bg-blue-600' : 'bg-slate-600'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
            <div className='flex flex-col'>
              <span className={`text-sm ${isAnnual ? 'text-white' : 'text-slate-400'}`}>
                {t('pricing.annual') || '연간'}
              </span>
              <span className={`${isAnnual ? 'bg-green-500' : 'bg-slate-400'} text-white text-xs px-2 py-1 rounded-full`}>
                {t('pricing.save') || '17% 절약'}
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm p-8 relative flex flex-col">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">{freePlan.name}</h3>
              <div className="text-4xl font-bold text-white mb-2">{freePlan.price}</div>
              <p className="text-slate-400">{freePlan.description}</p>
            </div>

            <div className="flex-1">
              <h4 className="text-white font-medium mb-4">
                {t('pricing.included') || '포함된 기능'}
              </h4>
              <ul className="space-y-3">
                {freePlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button className="w-full mt-8 bg-slate-700 hover:bg-slate-600 text-white">
              {t('pricing.free.cta') || '무료로 시작하기'}
            </Button>
          </Card>

          {/* Pro Plan */}
          <Card className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-blue-500/50 backdrop-blur-sm p-8 relative flex flex-col">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-full text-sm font-medium">
                {proPlan.badge}
              </span>
            </div>

            <div className="text-center mb-8 mt-4">
              <h3 className="text-2xl font-bold text-white mb-2">{proPlan.name}</h3>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="text-4xl font-bold text-white">{currentProPrice}</div>
                <div className="text-slate-400">
                  /{isAnnual ? (t('pricing.year') || '년') : (t('pricing.month') || '월')}
                </div>
              </div>
              {isAnnual && (
                <div className="text-sm text-slate-400 line-through mb-2">
                  {proPlan.originalAnnualPrice}/{t('pricing.year') || '년'}
                </div>
              )}
              <p className="text-slate-300">{proPlan.description}</p>
            </div>

            <div className="flex-1">
              <div>
                <h4 className="text-white font-medium mb-4">
                  {t('pricing.everything') || '모든 기능 포함'}
                </h4>
                <ul className="space-y-3">
                  {proPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Button 
              className={`w-full mt-8 ${
                isAuthenticated && isUserOnProPlan
                  ? 'bg-green-600 hover:bg-green-700 cursor-default'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
              } text-white`}
              disabled={isAuthenticated && isUserOnProPlan}
            >
              {isAuthenticated && isUserOnProPlan
                ? (t('pricing.pro.currentPlan') || '현재 이용 중인 요금제')
                : (t('pricing.pro.cta') || 'Pro로 업그레이드')
              }
            </Button>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            {t('pricing.faq.title') || '자주 묻는 질문'}
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm p-6 text-left">
              <h3 className="text-lg font-medium text-white mb-2">
                {t('pricing.faq.q1.question') || '무료 버전에서 Pro로 업그레이드할 수 있나요?'}
              </h3>
              <p className="text-slate-400">
                {t('pricing.faq.q1.answer') || '네, 언제든지 Pro 버전으로 업그레이드할 수 있습니다. 기존 데이터는 모두 유지됩니다.'}
              </p>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm p-6 text-left">
              <h3 className="text-lg font-medium text-white mb-2">
                {t('pricing.faq.q2.question') || 'AI 선물 추천 기능은 어떻게 작동하나요?'}
              </h3>
              <p className="text-slate-400">
                {t('pricing.faq.q2.answer') || 'AI가 위시리스트 패턴과 선호도를 분석하여 개인화된 선물을 추천해드립니다. 생일, 기념일 등 특별한 날에 맞는 완벽한 선물을 찾아드려요.'}
              </p>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm p-6 text-left">
              <h3 className="text-lg font-medium text-white mb-2">
                {t('pricing.faq.q3.question') || '언제든지 구독을 취소할 수 있나요?'}
              </h3>
              <p className="text-slate-400">
                {t('pricing.faq.q3.answer') || '네, 언제든지 구독을 취소할 수 있습니다. 구독 기간 종료 후 무료 버전으로 자동 전환됩니다.'}
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}