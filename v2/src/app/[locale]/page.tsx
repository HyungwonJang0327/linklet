import { notFound } from 'next/navigation'

import { createT, getDictionary, isLocale } from '@/shared/i18n'

// 랜딩 자리표시자 — F03 에서 레이아웃(헤더·본문·<html lang>)을 확인하기 위한 최소 본문.
// 랜딩 이식 때 이 파일을 교체한다. 서버 컴포넌트: getDictionary → createT (i18n L6).

export default async function LandingPage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const t = createT(await getDictionary(locale))

  return (
    <div className="flex flex-col gap-2 px-page-x py-6">
      <h1 className="text-display">{t('common.appName')}</h1>
      <p className="text-body text-muted">{t('metadata.description')}</p>
    </div>
  )
}
