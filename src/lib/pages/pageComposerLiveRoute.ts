import { frontendPathToPageSlug, pageSlugToFrontendPath } from '@/lib/pages/pageComposer'

/**
 * Resolve the CMS-managed page path for live composer editing.
 * Non-CMS frontend routes return `null`, and secured internal surfaces map to home (`/`).
 */
export function resolveComposerPagePathForPathname(pathname: string): null | string {
  if (pathname.startsWith('/admin') || pathname.startsWith('/docs') || pathname.startsWith('/ops')) {
    return '/'
  }

  const slug = frontendPathToPageSlug(pathname)

  return slug ? pageSlugToFrontendPath(slug) : null
}

/**
 * Backward-compatible helper for older call sites that still expect a string.
 * Non-CMS routes keep their raw pathname and should be gated by `resolveComposerPagePathForPathname`.
 */
export function composerPagePathForPathname(pathname: string): string {
  return resolveComposerPagePathForPathname(pathname) || pathname
}
