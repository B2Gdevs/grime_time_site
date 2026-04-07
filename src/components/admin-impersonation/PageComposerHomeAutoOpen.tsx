'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

import { usePageComposerOptional } from '@/components/admin-impersonation/PageComposerContext'

export function PageComposerHomeAutoOpen({
  enabled,
}: {
  enabled: boolean
}) {
  const composer = usePageComposerOptional()
  const pathname = usePathname()
  const previousPathnameRef = useRef<null | string>(null)

  useEffect(() => {
    const previousPathname = previousPathnameRef.current
    previousPathnameRef.current = pathname

    if (!enabled || !composer || pathname !== '/') {
      return
    }

    if (composer.isOpen || previousPathname === pathname) {
      return
    }

    composer.setActivePagePath('/')
    composer.setActiveTab('content')
    composer.open()
  }, [composer, enabled, pathname])

  return null
}
