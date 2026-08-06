'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { track, initSession, createScrollTracker, createTimeTracker } from '@/lib/analytics'

export function PageTracker() {
  const pathname = usePathname()
  const prevPath = useRef<string | null>(null)

  useEffect(() => {
    initSession()
  }, [])

  useEffect(() => {
    if (prevPath.current === pathname) return
    prevPath.current = pathname

    track('page_view', { url: pathname })

    const cleanupScroll = createScrollTracker(pathname)
    const fireTimeEvent = createTimeTracker(pathname)

    return () => {
      cleanupScroll()
      fireTimeEvent()
    }
  }, [pathname])

  return null
}
