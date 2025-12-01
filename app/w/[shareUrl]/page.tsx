import { headers } from 'next/headers'
import { type Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionary'
import SharedWishlistClient from './shared-wishlist-client'

// Enable ISR with 10 minute revalidation
export const revalidate = 600

interface SharedWishlistPageProps {
  params: Promise<{
    shareUrl: string
  }>
}

async function detectUserLocale(): Promise<Locale> {
  try {
    const headersList = await headers()
    
    // First try to get country from middleware header
    const country = headersList.get('x-user-country')
    
    if (country) {
      // Map countries to locales
      const countryToLocale: Record<string, Locale> = {
        'KR': 'kr',
        'JP': 'jp'
      }
      
      return countryToLocale[country] || 'en'
    }
    
    // Fallback to Accept-Language header
    const acceptLanguage = headersList.get('accept-language') || ''
    const primaryLanguage = acceptLanguage.split(',')[0].split('-')[0].toLowerCase()
    
    const languageToLocale: Record<string, Locale> = {
      'ko': 'kr',
      'ja': 'jp'
    }
    
    return languageToLocale[primaryLanguage] || 'en'
    
  } catch (error) {
    console.error('Failed to detect locale:', error)
    return 'en'
  }
}

export default async function SharedWishlistPage({ params }: SharedWishlistPageProps) {
  const { shareUrl } = await params
  const locale = await detectUserLocale()
  console.log('locale:::::', locale)
  const dictionary = await getDictionary(locale)

  return (
    <div>
      <SharedWishlistClient
        shareUrl={shareUrl}
        dictionary={dictionary}
        locale={locale}
      />
    </div>
  )
}