import { type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import { Heart, Share2, Gift, Smartphone, ShoppingBag, Star } from "lucide-react";
import Link from "next/link";

interface HomePageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  const features = [
    {
      icon: Heart,
      titleKey: "landing.features.organize.title",
      descKey: "landing.features.organize.description"
    },
    {
      icon: Share2,
      titleKey: "landing.features.share.title", 
      descKey: "landing.features.share.description"
    },
    {
      icon: Gift,
      titleKey: "landing.features.gift.title",
      descKey: "landing.features.gift.description"
    },
    {
      icon: Smartphone,
      titleKey: "landing.features.mobile.title",
      descKey: "landing.features.mobile.description"
    }
  ];

  const useCases = [
    {
      icon: Gift,
      titleKey: "landing.useCases.birthday.title",
      descKey: "landing.useCases.birthday.description",
      color: "from-pink-500 to-rose-500"
    },
    {
      icon: ShoppingBag,
      titleKey: "landing.useCases.shopping.title", 
      descKey: "landing.useCases.shopping.description",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Star,
      titleKey: "landing.useCases.favorites.title",
      descKey: "landing.useCases.favorites.description", 
      color: "from-amber-500 to-orange-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Linklet
          </h1>
          <p className="text-2xl md:text-3xl mb-8 text-slate-200 font-light">
            {dictionary.wishlist.title} {dictionary.landing?.hero?.subtitle || "Manager"}
          </p>
          <p className="text-lg md:text-xl mb-12 text-slate-400 max-w-3xl mx-auto leading-relaxed">
            {dictionary.wishlist.subTitle1} <br />
            {dictionary.wishlist.subTitle2}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <a
              href={`/${locale}/login`}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              {dictionary.landing?.cta?.getStarted || "Get Started"}
            </a>
            <Link
              href="/w/demo"
              className="border-2 border-slate-500 hover:border-slate-400 text-slate-300 hover:text-white hover:bg-slate-800/30 px-10 py-4 rounded-xl font-semibold text-lg transition-all"
            >
              {dictionary.landing?.cta?.viewDemo || "View Demo"}
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-800/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {dictionary.landing?.features?.title || "주요 기능"}
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              {dictionary.landing?.features?.subtitle || "Linklet으로 위시리스트 관리가 이렇게 쉬워집니다"}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const keyParts = feature.titleKey.split('.');
              const featureKey = keyParts[keyParts.length - 2] || 'organize'; // Get "organize" from "landing.features.organize.title"
              return (
                <div key={index} className="text-center group">
                  <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {(dictionary.landing?.features as any)?.[featureKey]?.title || feature.titleKey}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    {(dictionary.landing?.features as any)?.[featureKey]?.description || feature.descKey}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {dictionary.landing?.useCases?.title || "다양한 활용법"}
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              {dictionary.landing?.useCases?.subtitle || "생일 선물부터 쇼핑 리스트까지, 다양하게 활용해보세요"}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {useCases.map((useCase, index) => {
              const Icon = useCase.icon;
              const keyParts = useCase.titleKey.split('.');
              const useCaseKey = keyParts[keyParts.length - 2] || 'birthday'; // Get "birthday" from "landing.useCases.birthday.title"
              return (
                <div key={index} className="bg-slate-800/50 rounded-2xl p-8 hover:bg-slate-800/70 transition-colors">
                  <div className={`bg-gradient-to-br ${useCase.color} w-12 h-12 rounded-lg flex items-center justify-center mb-6`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    {(dictionary.landing?.useCases as any)?.[useCaseKey]?.title || useCase.titleKey}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    {(dictionary.landing?.useCases as any)?.[useCaseKey]?.description || useCase.descKey}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {dictionary.landing?.finalCta?.title || "지금 시작해보세요"}
          </h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            {dictionary.landing?.finalCta?.subtitle || "무료로 위시리스트를 만들고 친구들과 공유해보세요"}
          </p>
          <a
            href={`/${locale}/login`}
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            {dictionary.landing?.finalCta?.button || "무료로 시작하기"}
          </a>
        </div>
      </section>
    </div>
  );
}