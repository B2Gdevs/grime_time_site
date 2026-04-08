import type { PageComposerCanvasMode } from '@/components/admin-impersonation/PageComposerContext'

export function canvasViewportFrameClassName(mode: PageComposerCanvasMode) {
  if (mode === 'mobile') {
    return 'mx-auto w-full max-w-[26rem]'
  }

  if (mode === 'tablet') {
    return 'mx-auto w-full max-w-[52rem]'
  }

  return 'w-full'
}

export function resolveCanvasViewportBreadcrumbs(pagePath: string) {
  if (pagePath === '/') {
    return ['Home']
  }

  return pagePath
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.replace(/-/g, ' '))
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
}
