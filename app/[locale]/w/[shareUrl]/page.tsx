import { type Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionary'
import SharedWishlistClient from './shared-wishlist-client'

interface SharedWishlistPageProps {
  params: Promise<{
    locale: Locale
    shareUrl: string
  }>
}

export default async function SharedWishlistPage({ params }: SharedWishlistPageProps) {
  const { locale, shareUrl } = await params
  const dictionary = await getDictionary(locale)

  return (
    <SharedWishlistClient 
      shareUrl={shareUrl}
      dictionary={dictionary}
    />
  )
}