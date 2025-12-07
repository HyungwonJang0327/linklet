'use client'

import { usePathname } from 'next/navigation'
import { Header } from './header'

export function ConditionalHeader() {
  const pathname = usePathname()

  // Hide header on settings, admin, and wishlist sharing pages
  const hideOnPaths = ['/settings', '/admin', '/w/']
  const shouldHideHeader = hideOnPaths.some(path =>
    pathname.includes(path)
  )

  if (shouldHideHeader) {
    return null
  }

  return <Header />
}