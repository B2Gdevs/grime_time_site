import type { CSSProperties } from 'react'

export const PORTAL_HEADER_HEIGHT = 'calc(var(--spacing) * 12)'
export const PORTAL_SIDEBAR_WIDTH = 'calc(var(--spacing) * 60)'
export const PORTAL_FLOATING_OFFSET = 'calc(var(--spacing) * 4)'
export const PORTAL_STICKY_TOP = 'calc(var(--header-height) + var(--spacing) * 4)'

export function buildPortalShellStyle(): CSSProperties {
  return {
    '--header-height': PORTAL_HEADER_HEIGHT,
    '--portal-floating-offset': PORTAL_FLOATING_OFFSET,
    '--portal-sticky-top': PORTAL_STICKY_TOP,
    '--sidebar-width': PORTAL_SIDEBAR_WIDTH,
  } as CSSProperties
}
