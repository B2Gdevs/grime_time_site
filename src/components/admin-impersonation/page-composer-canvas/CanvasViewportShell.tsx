'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import {
  usePageComposerOptional,
  type PageComposerToolbarState,
} from '@/components/admin-impersonation/PageComposerContext'
import { usePortalCopilotOptional } from '@/components/copilot/PortalCopilotContext'
import { pageSlugToFrontendPath } from '@/lib/pages/pageComposer'

import { CanvasViewportChrome, resolveCanvasViewportBreadcrumbs } from './CanvasViewportChrome'

export function PageComposerCanvasViewportShell({
  children,
  toolbarState,
}: {
  children: ReactNode
  toolbarState: null | PageComposerToolbarState
}) {
  const composer = usePageComposerOptional()
  const pathname = usePathname()
  const copilot = usePortalCopilotOptional()

  const isActive = Boolean(
    composer?.isOpen && composer.activePagePath && composer.activePagePath === pathname,
  )

  if (!composer || !isActive) {
    return <>{children}</>
  }

  const selectedSummary = toolbarState?.sectionSummaries.find((summary) => summary.index === composer.selectedIndex) ?? null
  const breadcrumbs = resolveCanvasViewportBreadcrumbs(toolbarState?.draftPage?.pagePath ?? pathname)
  const dirty = toolbarState?.dirty ?? false
  const pagePath = toolbarState?.draftPage?.pagePath ?? pathname
  const previewPath = toolbarState ? pageSlugToFrontendPath(toolbarState.slugDraft) : pathname

  return (
    <CanvasViewportChrome
      active={isActive}
      activeTab={composer.activeTab}
      breadcrumbs={breadcrumbs}
      dirty={dirty}
      isPublishTabActive={composer.activeTab === 'publish'}
      onClose={() => composer.close()}
      onOpenPublish={() => {
        composer.setActiveTab('publish')
        copilot?.openTools()
      }}
      onSetPreviewMode={(mode) => composer.setPreviewMode(mode)}
      pagePath={pagePath}
      previewMode={composer.previewMode}
      previewPath={previewPath}
      selectedBlockType={selectedSummary?.blockType ?? ''}
      selectedIndex={composer.selectedIndex}
      selectedLabel={selectedSummary?.label ?? (composer.selectedIndex === -1 ? 'Hero' : '')}
      selectedSummaryLabel={selectedSummary?.label ?? ''}
      toolbarState={toolbarState}
    >
      {children}
    </CanvasViewportChrome>
  )
}
