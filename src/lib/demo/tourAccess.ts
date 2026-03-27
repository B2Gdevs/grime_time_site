import { DEMO_EMAIL_SUFFIX } from '@/lib/demo/constants'

/** Portal + marketing Joyride: demo personas always; real admins only when demo mode is on. */
export function isPortalTourEnabled(args: {
  demoMode: boolean
  effectiveEmail: string
  isRealAdmin: boolean
}): boolean {
  const email = args.effectiveEmail.trim().toLowerCase()
  if (email.endsWith(DEMO_EMAIL_SUFFIX)) return true
  if (args.isRealAdmin && args.demoMode) return true
  return false
}

/** Marketing site tours: demo mode cookie, URL `?demo=1`, or demo persona logged in (future). */
export function isSiteTourEnabled(demoMode: boolean): boolean {
  return demoMode
}
