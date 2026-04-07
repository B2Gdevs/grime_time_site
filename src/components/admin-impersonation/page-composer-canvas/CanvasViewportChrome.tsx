'use client'

import type { ReactNode } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { type PageComposerCanvasMode, type PageComposerToolbarState } from '@/components/admin-impersonation/PageComposerContext'
import { CanvasViewportActions } from './CanvasViewportActions'
import { CanvasViewportDirtyBadge } from './CanvasViewportDirtyBadge'
import { CanvasViewportDraftFields } from './CanvasViewportDraftFields'
import { CanvasViewportIdentity } from './CanvasViewportIdentity'
import { CanvasViewportInteractable } from './CanvasViewportInteractable'

function canvasFrameClassName(mode: PageComposerCanvasMode) {
  if (mode === 'mobile') {
    return 'mx-auto w-full max-w-[26rem]'
  }

  if (mode === 'tablet') {
    return 'mx-auto w-full max-w-[52rem]'
  }

  return 'w-full'
}

function formatComposerBreadcrumbs(pagePath: string) {
  if (pagePath === '/') {
    return ['Home']
  }

  return pagePath
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.replace(/-/g, ' '))
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
}

export function CanvasViewportChrome({
  breadcrumbs,
  children,
  dirty,
  isPublishTabActive,
  onClose,
  onOpenPublish,
  onSetPreviewMode,
  pagePath,
  previewMode,
  previewPath,
  selectedSummaryLabel,
  toolbarState,
  activeTab,
  active,
  selectedBlockType,
  selectedIndex,
  selectedLabel,
}: {
  active: boolean
  activeTab: string
  breadcrumbs: string[]
  children: ReactNode
  dirty: boolean
  isPublishTabActive: boolean
  onClose: () => void
  onOpenPublish: null | (() => void)
  onSetPreviewMode: (mode: PageComposerCanvasMode) => void
  pagePath: string
  previewMode: PageComposerCanvasMode
  previewPath: string
  selectedBlockType: string
  selectedIndex: number
  selectedLabel: string
  selectedSummaryLabel: string
  toolbarState: null | PageComposerToolbarState
}) {
  return (
    <div className="page-composer-canvas min-w-0">
      <CanvasViewportInteractable
        active={active}
        activeTab={activeTab}
        dirty={dirty}
        pagePath={pagePath}
        previewMode={previewMode}
        selectedBlockType={selectedBlockType}
        selectedIndex={selectedIndex}
        selectedLabel={selectedLabel}
      />
      <div className="pointer-events-none fixed left-4 right-4 top-[calc(var(--portal-sticky-top)+0.75rem)] z-[95] md:left-[calc(var(--sidebar-width)+1rem)]">
        <TooltipProvider delayDuration={200}>
          <div className="pointer-events-auto relative w-full rounded-[1.45rem] border border-border/70 bg-background/94 px-3 py-2.5 shadow-xl backdrop-blur">
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CanvasViewportIdentity
                  breadcrumbs={breadcrumbs}
                  dirty={dirty}
                  pagePath={pagePath}
                  selectedSummaryLabel={selectedSummaryLabel}
                  toolbarState={toolbarState}
                />
                <CanvasViewportActions
                  onClose={onClose}
                  onSetPreviewMode={onSetPreviewMode}
                  previewMode={previewMode}
                  previewPath={previewPath}
                />
              </div>

              <CanvasViewportDraftFields
                isPublishTabActive={isPublishTabActive}
                onOpenPublish={onOpenPublish}
                toolbarState={toolbarState}
              />
            </div>

            <CanvasViewportDirtyBadge dirty={dirty} />
          </div>
        </TooltipProvider>
      </div>

      <div className={canvasFrameClassName(previewMode)}>{children}</div>
    </div>
  )
}

export function resolveCanvasViewportBreadcrumbs(pagePath: string) {
  return formatComposerBreadcrumbs(pagePath)
}
