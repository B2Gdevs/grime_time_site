const EMAIL_PATH_PATTERN = /(^|\/)[^/]*@[^/]+($|\/)/i
const GRIMETIME_IGNORED_ANALYTICS_PREFIXES = [
  '/admin',
  '/api',
  '/auth',
  '/login',
  '/logout',
  '/next',
  '/ops',
  '/portal',
]

type AnalyticsPageEvent = {
  url: string
}

export function sanitizeAnalyticsPageEvent<T extends AnalyticsPageEvent>(event: T): null | T {
  let parsed: URL

  try {
    parsed = new URL(event.url)
  } catch {
    return null
  }

  const pathname = normalizePathname(parsed.pathname)
  if (shouldIgnoreAnalyticsPath(pathname)) {
    return null
  }

  parsed.pathname = pathname
  parsed.search = ''
  parsed.hash = ''

  return {
    ...event,
    url: parsed.toString(),
  }
}

function normalizePathname(pathname: string) {
  if (!pathname) return '/'
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }
  return pathname
}

function shouldIgnoreAnalyticsPath(pathname: string) {
  if (!pathname.startsWith('/')) return true
  if (EMAIL_PATH_PATTERN.test(pathname)) return true

  return GRIMETIME_IGNORED_ANALYTICS_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}
