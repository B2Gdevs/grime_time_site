import { CUSTOMER_DASHBOARD_PATH } from '@/lib/navigation/portalPaths'

export function sanitizeNextPath(
  nextPath: null | string | undefined,
  fallback = CUSTOMER_DASHBOARD_PATH,
) {
  if (!nextPath) {
    return fallback
  }

  if (!nextPath.startsWith('/')) {
    return fallback
  }

  if (nextPath.startsWith('//')) {
    return fallback
  }

  return nextPath
}
