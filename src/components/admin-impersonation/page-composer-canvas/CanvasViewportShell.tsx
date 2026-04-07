'use client'

import { ExternalLinkIcon, Link2Icon, MonitorIcon, PlusIcon, SmartphoneIcon, TabletSmartphoneIcon, TypeIcon, XIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

import { usePageComposerOptional, type PageComposerToolbarState } from '@/components/admin-impersonation/PageComposerContext'
import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { useLiveCanvasInteractable } from '@/components/copilot/CopilotInteractable'
import { usePortalCopilotOptional } from '@/components/copilot/PortalCopilotContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { pageSlugToFrontendPath } from '@/lib/pages/pageComposer'
import { cn } from '@/utilities/ui'

import { CanvasActionButton, CanvasModeButton, CanvasToolbarField } from './CanvasPrimitives'

function canvasFrameClassName(mode: 'desktop' | 'mobile' | 'tablet') {
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

function LiveCanvasInteractable({
  active,
  activeTab,
  dirty,
  pagePath,
  previewMode,
  selectedBlockType,
  selectedIndex,
  selectedLabel,
}: {
  active: boolean
  activeTab: string
  dirty: boolean
  pagePath: string
  previewMode: string
  selectedBlockType: string
  selectedIndex: number
  selectedLabel: string
}) {
  useLiveCanvasInteractable({
    active,
    id: `canvas:${pagePath}`,
    state: {
      activeTab,
      dirty,
      pagePath,
      previewMode,
      selectedBlockType,
      selectedIndex,
      selectedLabel,
    },
  })

  return null
}

function CanvasModeStrip({
  activeMode,
  onSetMode,
}: {
  activeMode: 'desktop' | 'mobile' | 'tablet'
  onSetMode: (mode: 'desktop' | 'mobile' | 'tablet') => void
}) {
  return (
    <>
      <CanvasModeButton
        active={activeMode === 'desktop'}
        icon={<MonitorIcon className="h-4 w-4" />}
        label="Desktop preview"
        onClick={() => onSetMode('desktop')}
      />
      <CanvasModeButton
        active={activeMode === 'tablet'}
        icon={<TabletSmartphoneIcon className="h-4 w-4" />}
        label="Tablet preview"
        onClick={() => onSetMode('tablet')}
      />
      <CanvasModeButton
        active={activeMode === 'mobile'}
        icon={<SmartphoneIcon className="h-4 w-4" />}
        label="Mobile preview"
        onClick={() => onSetMode('mobile')}
      />
    </>
  )
}

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
  const previewPath = toolbarState ? pageSlugToFrontendPath(toolbarState.slugDraft) : pathname
  const pageStatusLabel = toolbarState?.draftPage?._status === 'published' ? 'Published' : 'Draft'
  const breadcrumbs = formatComposerBreadcrumbs(toolbarState?.draftPage?.pagePath ?? pathname)

  return (
    <div className="page-composer-canvas min-w-0">
      <LiveCanvasInteractable
        active={isActive}
        activeTab={composer.activeTab}
        dirty={toolbarState?.dirty ?? false}
        pagePath={toolbarState?.draftPage?.pagePath ?? pathname}
        previewMode={composer.previewMode}
        selectedBlockType={selectedSummary?.blockType ?? ''}
        selectedIndex={composer.selectedIndex}
        selectedLabel={selectedSummary?.label ?? (composer.selectedIndex === -1 ? 'Hero' : '')}
      />
      <div className="pointer-events-none fixed left-4 right-4 top-[calc(var(--portal-sticky-top)+0.75rem)] z-[95] md:left-[calc(var(--sidebar-width)+1rem)]">
        <TooltipProvider delayDuration={200}>
          <div className="pointer-events-auto relative w-full rounded-[1.45rem] border border-border/70 bg-background/94 px-3 py-2.5 shadow-xl backdrop-blur">
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <div className={cn('flex flex-wrap items-center gap-2', adminPanelChrome.fieldLabelTight)}>
                    <span>Composer admin bar</span>
                    {breadcrumbs.map((segment, index) => (
                      <span className="inline-flex items-center gap-2" key={`${segment}-${index}`}>
                        <span>/</span>
                        <span>{segment}</span>
                      </span>
                    ))}
                  </div>
                  {toolbarState?.draftPage ? <Badge variant="secondary">{toolbarState.draftPage.pagePath}</Badge> : null}
                  {toolbarState?.draftPage ? <Badge variant="outline">{toolbarState.draftPage._status || 'draft'}</Badge> : null}
                  {toolbarState?.dirty ? <Badge>Unsaved</Badge> : null}
                  {selectedSummary ? <Badge variant="outline">{selectedSummary.label}</Badge> : null}
                </div>
                <div className="flex shrink-0 items-center justify-end gap-2">
                  <Button asChild className="h-10 rounded-xl" type="button" variant="outline">
                    <a
                      aria-label="Open route preview"
                      className="inline-flex items-center gap-2"
                      href={previewPath}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Preview
                      <ExternalLinkIcon className="h-4 w-4 shrink-0" />
                    </a>
                  </Button>
                  <CanvasModeStrip
                    activeMode={composer.previewMode}
                    onSetMode={(mode) => composer.setPreviewMode(mode)}
                  />
                  <CanvasActionButton
                    label="Close composer"
                    onClick={(event) => {
                      event.preventDefault()
                      composer.close()
                    }}
                  >
                    <XIcon className="h-4 w-4" />
                  </CanvasActionButton>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {toolbarState ? (
                  <>
                    <CanvasToolbarField
                      className="min-w-0 flex-[1.3_1_16rem]"
                      icon={<TypeIcon className="h-4 w-4" />}
                      onChange={toolbarState.onSetTitleDraft}
                      placeholder="Page title"
                      value={toolbarState.titleDraft}
                    />
                    <CanvasToolbarField
                      className="min-w-0 flex-[0.8_1_12rem]"
                      icon={<Link2Icon className="h-4 w-4" />}
                      onChange={toolbarState.onSetSlugDraft}
                      placeholder="page-slug"
                      value={toolbarState.slugDraft}
                    />
                    <div className="flex h-10 min-w-0 flex-[1_1_16rem] items-center rounded-xl border border-input bg-background px-3 text-sm text-muted-foreground">
                      {toolbarState.loading
                        ? 'Loading current route...'
                        : toolbarState.draftPage
                          ? toolbarState.draftPage.id
                            ? 'Editing the page document for this route.'
                            : 'This route does not have a page yet. Save draft or publish to create it.'
                          : 'No page loaded yet'}
                    </div>
                    <Button
                      className="h-10 rounded-xl"
                      disabled={
                        toolbarState.creatingDraftClone ||
                        toolbarState.loading ||
                        toolbarState.dirty ||
                        typeof toolbarState.draftPage?.id !== 'number'
                      }
                      onClick={toolbarState.onCreateDraft}
                      type="button"
                      variant="outline"
                    >
                      <PlusIcon className="h-4 w-4" />
                      {toolbarState.creatingDraftClone ? 'Creating...' : 'Create draft'}
                    </Button>
                    <Button
                      className="h-10 rounded-xl"
                      onClick={() => {
                        composer.setActiveTab('publish')
                        copilot?.openTools()
                      }}
                      type="button"
                      variant={composer.activeTab === 'publish' ? 'default' : 'outline'}
                    >
                      {pageStatusLabel}
                    </Button>
                    <div className={adminPanelChrome.segmentedControlBar}>
                      <button
                        className={`rounded-lg px-3 text-sm transition ${
                          toolbarState.visibilityDraft === 'public'
                            ? 'bg-foreground text-background'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        onClick={() => toolbarState.onSetVisibilityDraft('public')}
                        type="button"
                      >
                        Public
                      </button>
                      <button
                        className={`rounded-lg px-3 text-sm transition ${
                          toolbarState.visibilityDraft === 'private'
                            ? 'bg-foreground text-background'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        onClick={() => toolbarState.onSetVisibilityDraft('private')}
                        type="button"
                      >
                        Private
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            {toolbarState?.dirty ? (
              <div className="pointer-events-none absolute left-1/2 top-full z-10 -translate-x-1/2 -translate-y-1/2">
                <Badge className="rounded-full px-3 py-1 shadow-lg" variant="default">
                  Unsaved
                </Badge>
              </div>
            ) : null}
          </div>
        </TooltipProvider>
      </div>

      <div className={canvasFrameClassName(composer.previewMode)}>{children}</div>
    </div>
  )
}
