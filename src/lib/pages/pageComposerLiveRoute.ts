/**
 * Route the visual composer targets for "live page editing" when the shell is open on a marketing URL.
 * Secured admin/docs/ops surfaces map to home (`/`) so the composer matches SiteOperatorToolsPanel behavior.
 */
export function composerPagePathForPathname(pathname: string): string {
  if (pathname.startsWith('/admin') || pathname.startsWith('/docs') || pathname.startsWith('/ops')) {
    return '/'
  }
  return pathname
}
