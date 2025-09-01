'use client'

import { usePathname } from 'next/navigation'
import { Header } from './header'

export function ConditionalHeader() {
  const pathname = usePathname()
  
  // Hide header on settings pages
  const hideOnPaths = ['/settings', '/w/']
  console.log(hideOnPaths, pathname)
  const shouldHideHeader = hideOnPaths.some(path => 
    pathname.includes(path)
  )
  
  if (shouldHideHeader) {
    return null
  }
  
  return <Header />
}