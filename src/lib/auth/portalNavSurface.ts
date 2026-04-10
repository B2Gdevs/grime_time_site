'use client'

import { usePathname } from 'next/navigation'
import { isOpsPortalPath } from '@/lib/navigation/portalPaths'

/** Staff-only portal areas: full internal chrome (docs, admin shortcuts). */
export function usePortalStaffRoute(): boolean {
  const pathname = usePathname() || '/'
  return isOpsPortalPath(pathname) || pathname.startsWith('/docs')
}
