export function sanitizeNextPath(nextPath: null | string | undefined, fallback = '/dashboard') {
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
