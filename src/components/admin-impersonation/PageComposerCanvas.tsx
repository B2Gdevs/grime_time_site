'use client'

import { CopyPlusIcon, EyeIcon, EyeOffIcon, ExternalLinkIcon, Link2Icon, MonitorIcon, PlusIcon, SmartphoneIcon, TabletSmartphoneIcon, Trash2Icon, TypeIcon, XIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import {
  PAGE_COMPOSER_TOOLBAR_EVENT,
  usePageComposerOptional,
  type PageComposerCanvasMode,
  type PageComposerToolbarState,
} from '@/components/admin-impersonation/PageComposerContext'
import { useLiveCanvasInteractable } from '@/components/copilot/CopilotInteractable'
import { usePortalCopilotOptional } from '@/components/copilot/PortalCopilotContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { pageSlugToFrontendPath } from '@/lib/pages/pageComposer'
import { cn } from '@/utilities/ui'

function canvasFrameClassName(mode: PageComposerCanvasMode) {
  if (mode === 'mobile') {
    return 'mx-auto w-full max-w-[26rem]'
  }

  if (mode === 'tablet') {
    return 'mx-auto w-full max-w-[52rem]'
  }

  return 'w-full'
}

function CanvasModeButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          className="h-10 w-10 rounded-xl"
          onClick={onClick}
          size="icon"
          type="button"
          variant={active ? 'default' : 'outline'}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function CanvasActionButton({
  children,
  className,
  label,
  onClick,
}: {
  children: React.ReactNode
  className?: string
  label: string
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          data-page-composer-interactive="true"
          aria-label={label}
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-background/95 text-muted-foreground shadow-sm transition hover:border-primary/40 hover:bg-primary/5 hover:text-foreground',
            className,
          )}
          onClick={onClick}
          type="button"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function CanvasInsertHandle({
  align,
  hidden = false,
  onClick,
}: {
  align: 'bottom' | 'top'
  hidden?: boolean
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}) {
  if (hidden) {
    return null
  }

  return (
    <button
      aria-label={align === 'top' ? 'Add block above' : 'Add block below'}
      className={cn(
        'absolute left-1/2 z-20 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground shadow-lg opacity-0 transition hover:border-primary/40 hover:bg-primary/5 hover:text-foreground group-hover:opacity-100 group-focus-within:opacity-100 data-[selected=true]:opacity-100',
        align === 'top' ? '-top-4' : '-bottom-4',
      )}
      data-page-composer-interactive="true"
      onClick={onClick}
      type="button"
    >
      <PlusIcon className="h-4 w-4" />
    </button>
  )
}

export function usePageComposerCanvasToolbarState() {
  const [toolbarState, setToolbarState] = useState<null | PageComposerToolbarState>(null)

  useEffect(() => {
    function handleToolbarEvent(event: Event) {
      const customEvent = event as CustomEvent<null | PageComposerToolbarState>
      setToolbarState(customEvent.detail ?? null)
    }

    window.addEventListener(PAGE_COMPOSER_TOOLBAR_EVENT, handleToolbarEvent as EventListener)

    return () => {
      window.removeEventListener(PAGE_COMPOSER_TOOLBAR_EVENT, handleToolbarEvent as EventListener)
    }
  }, [])

  return toolbarState
}

function ToolbarField({
  className,
  icon,
  onChange,
  placeholder,
  value,
}: {
  className?: string
  icon: React.ReactNode
  onChange: (value: string) => void
  placeholder: string
  value: string
}) {
  return (
    <div className={cn('relative', className)}>
      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">{icon}</div>
      <Input className="h-10 pl-10" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
    </div>
  )
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

export function PageComposerCanvasViewport({ children }: { children: React.ReactNode }) {
  const composer = usePageComposerOptional()
  const pathname = usePathname()
  const toolbarState = usePageComposerCanvasToolbarState()
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
          <div
            className="pointer-events-auto relative w-full rounded-[1.45rem] border border-border/70 bg-background/94 px-3 py-2.5 shadow-xl backdrop-blur"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex flex-1 items-center gap-2 overflow-hidden">
                {toolbarState ? (
                  <>
                    <ToolbarField
                      className="min-w-0 flex-[1.3_1_16rem]"
                      icon={<TypeIcon className="h-4 w-4" />}
                      onChange={toolbarState.onSetTitleDraft}
                      placeholder="Page title"
                      value={toolbarState.titleDraft}
                    />
                    <ToolbarField
                      className="min-w-0 flex-[0.8_1_12rem]"
                      icon={<Link2Icon className="h-4 w-4" />}
                      onChange={toolbarState.onSetSlugDraft}
                      placeholder="page-slug"
                      value={toolbarState.slugDraft}
                    />
                    {toolbarState.draftPage ? (
                      <Select
                        disabled={toolbarState.loading || !toolbarState.availablePages.length}
                        onValueChange={(value) => toolbarState.switchToPage(Number(value))}
                        value={String(toolbarState.draftPage.id)}
                      >
                        <SelectTrigger className="h-10 min-w-0 flex-[0.9_1_13rem] bg-background/90">
                          <SelectValue placeholder="Select a page" />
                        </SelectTrigger>
                        <SelectContent className="z-[130]">
                          {toolbarState.availablePages.map((page) => (
                            <SelectItem key={page.id} value={String(page.id)}>
                              {page.title} ({page.visibility || 'public'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex h-10 min-w-0 flex-[0.9_1_13rem] items-center rounded-xl border border-input bg-background px-3 text-sm text-muted-foreground">
                        {toolbarState.loading ? 'Loading current page...' : 'No page loaded yet'}
                      </div>
                    )}
                  </>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center justify-end gap-2">
                {toolbarState ? (
                  <>
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
                    <div className="inline-flex h-10 rounded-xl border border-border/70 bg-card/50 p-1">
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
                <CanvasModeButton
                  active={composer.previewMode === 'desktop'}
                  icon={<MonitorIcon className="h-4 w-4" />}
                  label="Desktop preview"
                  onClick={() => composer.setPreviewMode('desktop')}
                />
                <CanvasModeButton
                  active={composer.previewMode === 'tablet'}
                  icon={<TabletSmartphoneIcon className="h-4 w-4" />}
                  label="Tablet preview"
                  onClick={() => composer.setPreviewMode('tablet')}
                />
                <CanvasModeButton
                  active={composer.previewMode === 'mobile'}
                  icon={<SmartphoneIcon className="h-4 w-4" />}
                  label="Mobile preview"
                  onClick={() => composer.setPreviewMode('mobile')}
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

export function PageComposerCanvasSection({
  children,
  index,
  label,
  supportsInsertionAbove = true,
}: {
  children: React.ReactNode
  index: number
  label: string
  supportsInsertionAbove?: boolean
}) {
  const composer = usePageComposerOptional()
  const pathname = usePathname()
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const toolbarState = usePageComposerCanvasToolbarState()

  const isActive = Boolean(
    composer?.isOpen && composer.activePagePath && composer.activePagePath === pathname,
  )
  const isSelected = Boolean(isActive && composer?.selectedIndex === index)
  const sectionSummary = toolbarState ? toolbarState.sectionSummaries.find((summary) => summary.index === index) ?? null : null
  const sectionBadgeLabel = index < 0 ? 'Hero' : `Section ${index + 1}`

  useEffect(() => {
    if (!isSelected) {
      return
    }

    if (typeof sectionRef.current?.scrollIntoView === 'function') {
      sectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [isSelected])

  if (!composer || !isActive) {
    return <>{children}</>
  }

  return (
    <div
      ref={sectionRef}
      className={cn(
        'group relative rounded-[1.6rem] transition',
        isSelected ? 'ring-2 ring-primary/40 ring-offset-4 ring-offset-background' : 'hover:ring-2 hover:ring-primary/20 hover:ring-offset-4 hover:ring-offset-background',
      )}
      data-page-composer-block-index={index}
      data-page-composer-selected={isSelected ? 'true' : 'false'}
      onClickCapture={(event) => {
        const target = event.target as HTMLElement | null
        const interactiveTarget = target?.closest('[data-page-composer-interactive="true"]')

        if (interactiveTarget) {
          composer.setSelectedIndex(index)
          return
        }

        event.preventDefault()
        event.stopPropagation()
        composer.setSelectedIndex(index)
      }}
    >
      <CanvasInsertHandle
        align="top"
        hidden={!toolbarState || !supportsInsertionAbove}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          toolbarState?.onAddAbove(index)
        }}
      />
      <div
        className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-2 rounded-full border border-border/70 bg-background/94 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-foreground shadow-lg opacity-0 backdrop-blur transition group-hover:opacity-100 group-focus-within:opacity-100 data-[selected=true]:opacity-0"
        data-selected={isSelected ? 'true' : 'false'}
      >
        <span className="text-primary">{sectionBadgeLabel}</span>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground">{label}</span>
      </div>

      {sectionSummary && toolbarState ? (
        <div
          className="pointer-events-none absolute inset-x-3 top-3 z-20 flex min-h-10 items-start gap-3 rounded-[1.2rem] border border-border/70 bg-background/94 px-3 py-2 shadow-lg opacity-0 backdrop-blur transition group-hover:opacity-100 group-focus-within:opacity-100"
          data-page-composer-interactive="true"
        >
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge variant="secondary">{sectionBadgeLabel}</Badge>
            <Badge variant="outline">{sectionSummary.blockType}</Badge>
            {sectionSummary.variant ? <Badge variant="outline">{sectionSummary.variant}</Badge> : null}
            {sectionSummary.badges
              .filter((badge) => badge !== sectionSummary.variant)
              .map((badge) => (
                <Badge key={`${sectionSummary.index}-${badge}`} variant={badge === 'reusable' ? 'secondary' : 'outline'}>
                  {badge}
                </Badge>
              ))}
          </div>
        </div>
      ) : null}

      {sectionSummary && toolbarState && index >= 0 ? (
        <div
          className="pointer-events-none absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100"
          data-page-composer-interactive="true"
        >
          <div className="pointer-events-auto flex flex-col gap-2 rounded-[1.1rem] border border-border/70 bg-background/94 p-2 shadow-lg backdrop-blur">
            <CanvasActionButton
              label={sectionSummary.hidden ? 'Show block' : 'Hide block'}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                toolbarState.onToggleHidden(index)
              }}
            >
              {sectionSummary.hidden ? <EyeIcon className="h-4 w-4" /> : <EyeOffIcon className="h-4 w-4" />}
            </CanvasActionButton>
            <CanvasActionButton
              label="Duplicate block"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                toolbarState.onDuplicateBlock(index)
              }}
            >
              <CopyPlusIcon className="h-4 w-4" />
            </CanvasActionButton>
            <CanvasActionButton
              className="border-destructive/30 text-destructive hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
              label="Delete block"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                toolbarState.onDeleteBlock(index)
              }}
            >
              <Trash2Icon className="h-4 w-4" />
            </CanvasActionButton>
          </div>
        </div>
      ) : null}

      <div data-selected={isSelected ? 'true' : 'false'}>{children}</div>
      <CanvasInsertHandle
        align="bottom"
        hidden={!toolbarState}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          toolbarState?.onAddBelow(index)
        }}
      />
    </div>
  )
}
