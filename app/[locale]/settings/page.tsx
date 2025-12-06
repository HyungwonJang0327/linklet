import { redirect } from 'next/navigation'
import { type Locale } from '@/lib/i18n/config'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

interface SettingsPageProps {
  params: Promise<{ locale: Locale }>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale } = await params

  // Check authentication before redirecting
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    redirect(`/${locale}/login`)
  }

  redirect(`/${locale}/settings/wishlists`)
}