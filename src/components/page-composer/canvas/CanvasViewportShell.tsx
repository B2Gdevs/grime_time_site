'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import {
  usePageComposerOptional,
  type PageComposerToolbarState,
} from '@/components/page-composer/PageComposerContext'
import { usePortalCopilotOptional } from '@/components/copilot/PortalCopilotContext'

import { CanvasViewportChrome } from './CanvasViewportChrome'
import { resolveCanvasViewportBreadcrumbs } from './CanvasViewportUtils'

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
  return (
    <CanvasViewportChrome
      active={isActive}
      activeTab={composer.activeTab}
      breadcrumbs={breadcrumbs}
      dirty={dirty}
      isPublishTabActive={composer.activeTab === 'pages'}
      onClose={() => composer.close()}
      onOpenPublish={() => {
        composer.setActiveTab('pages')
        copilot?.openTools()
      }}
      onSetPreviewMode={(mode) => composer.setPreviewMode(mode)}
      pagePath={pagePath}
      previewMode={composer.previewMode}
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
