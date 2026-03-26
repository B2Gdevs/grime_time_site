export const IMPERSONATION_COOKIE_NAME = 'gt-impersonation-user'

export function normalizeImpersonationUserId(value: null | number | string | undefined): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value
  }

  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const parsed = Number.parseInt(trimmed, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export function getImpersonationUserIdFromCookieHeader(cookieHeader: null | string): number | null {
  if (!cookieHeader) {
    return null
  }

  const cookiePair = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${IMPERSONATION_COOKIE_NAME}=`))

  if (!cookiePair) {
    return null
  }

  return normalizeImpersonationUserId(cookiePair.slice(IMPERSONATION_COOKIE_NAME.length + 1))
}

export function getImpersonationUserIdFromCookies(
  cookieStore: {
    get: (name: string) => undefined | { value?: string }
  },
): number | null {
  return normalizeImpersonationUserId(cookieStore.get(IMPERSONATION_COOKIE_NAME)?.value)
}
