'use client'

import { usePathname } from 'next/navigation'

/** Staff-only portal areas: full internal chrome (docs, admin shortcuts). */
export function usePortalStaffRoute(): boolean {
  const pathname = usePathname() || '/'
  return pathname.startsWith('/ops') || pathname.startsWith('/docs')
}
