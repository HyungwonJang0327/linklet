import { redirect } from 'next/navigation'
import { type Locale } from '@/lib/i18n/config'

interface SettingsPageProps {
  params: Promise<{ locale: Locale }>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale } = await params
  redirect(`/${locale}/settings/wishlists`)
}