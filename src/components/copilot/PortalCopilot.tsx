'use client'

import {
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAuiState,
} from '@assistant-ui/react'
import { BotIcon, GripIcon, LifeBuoyIcon, SparklesIcon, XIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useDragControls } from 'motion/react'
import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { SiteOperatorToolsPanel, type SiteOperatorToolsPanelProps } from '@/components/admin-impersonation/SiteOperatorToolsPanel'
import { COPILOT_MEDIA_GENERATION_ENABLED } from '@/constants/copilotFeatures'
import { usePageComposerOptional } from '@/components/page-composer/PageComposerContext'
import { CopilotMediaWorkbench } from '@/components/copilot/CopilotMediaWorkbench'
import { Button } from '@/components/ui/button'
import type { CopilotAuthoringContext, CopilotFocusedSession } from '@/lib/ai'
import { isUnknownRecord } from '@/lib/is-unknown-record'
import { cn } from '@/utilities/ui'

import { usePortalCopilot } from './PortalCopilotContext'
import { RecordList, SourcesList, TourList, type CopilotBundle } from './PortalCopilotPanels'

type Corner = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
type AssistantUiMessagePart = {
  text?: string
  type?: string
}

const STORAGE_KEY = 'portal-copilot-corner-v1'

function joinMessageText(content: readonly AssistantUiMessagePart[] | string | undefined) {
  if (typeof content === 'string') return content.trim()
  if (!Array.isArray(content)) return ''

  return content
    .map((part) => (part?.type === 'text' && typeof part.text === 'string' ? part.text : ''))
    .join('')
    .trim()
}

function readStoredCorner(fallback: Corner): Corner {
  if (typeof window === 'undefined') {
    return fallback
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'top-left' ||
    stored === 'top-right' ||
    stored === 'bottom-left' ||
    stored === 'bottom-right'
    ? stored
    : fallback
}

function pickCorner(point: { x: number; y: number }): Corner {
  if (typeof window === 'undefined') {
    return 'bottom-left'
  }

  const corners: Record<Corner, { x: number; y: number }> = {
    'bottom-left': { x: 0, y: window.innerHeight },
    'bottom-right': { x: window.innerWidth, y: window.innerHeight },
    'top-left': { x: 0, y: 0 },
    'top-right': { x: window.innerWidth, y: 0 },
  }

  let nearest: Corner = 'bottom-left'
  let nearestDistance = Number.POSITIVE_INFINITY

  for (const [corner, cornerPoint] of Object.entries(corners) as Array<[Corner, { x: number; y: number }]>) {
    const distance = Math.hypot(point.x - cornerPoint.x, point.y - cornerPoint.y)

    if (distance < nearestDistance) {
      nearest = corner
      nearestDistance = distance
    }
  }

  return nearest
}

function pickCornerFromRect(rect: DOMRect): Corner {
  return pickCorner({
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  })
}

function clampPosition(value: number, max: number): number {
  return Math.min(Math.max(value, 0), Math.max(max, 0))
}

function readCssPixelVariable(name: string, fallback: number): number {
  if (typeof window === 'undefined') {
    return fallback
  }

  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const parsed = Number.parseFloat(value)

  return Number.isFinite(parsed) ? parsed : fallback
}

function resolveCornerPosition(args: {
  corner: Corner
  height: number
  width: number
}): { x: number; y: number } {
  if (typeof window === 'undefined') {
    return { x: 0, y: 0 }
  }

  const floatingOffset = readCssPixelVariable('--portal-floating-offset', 16)
  const stickyTop = readCssPixelVariable('--portal-sticky-top', 80)
  const maxX = window.innerWidth - args.width
  const maxY = window.innerHeight - args.height

  const left = clampPosition(floatingOffset, maxX)
  const right = clampPosition(window.innerWidth - args.width - floatingOffset, maxX)
  const top = clampPosition(stickyTop, maxY)
  const bottom = clampPosition(window.innerHeight - args.height - floatingOffset, maxY)

  switch (args.corner) {
    case 'top-left':
      return { x: left, y: top }
    case 'top-right':
      return { x: right, y: top }
    case 'bottom-right':
      return { x: right, y: bottom }
    case 'bottom-left':
    default:
      return { x: left, y: bottom }
  }
}

function defaultCornerForPath(_pathname: string): Corner {
  return 'bottom-left'
}

function DragHandle({ onPointerDown }: { onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void }) {
  return (
    <motion.div
      aria-label="Move copilot"
      className="flex size-8 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground active:cursor-grabbing"
      onPointerDown={onPointerDown}
      role="button"
      tabIndex={0}
      whileTap={{ scale: 0.96 }}
    >
      <GripIcon className="size-4" />
    </motion.div>
  )
}

function asCopilotBundle(value: unknown): CopilotBundle | null {
  if (!isUnknownRecord(value)) {
    return null
  }

  const bundle = value

  if (
    typeof bundle.query !== 'string' ||
    !('insights' in bundle) ||
    !Array.isArray(bundle.sources)
  ) {
    return null
  }

  return value as CopilotBundle
}

function CopilotMessagePanels() {
  const isAssistant = useAuiState((state) => state.message.role === 'assistant')
  const messageBundle = useAuiState((state) => asCopilotBundle(state.message.metadata?.custom))

  if (!isAssistant) return null

  const bundle = messageBundle
  if (!bundle) return null

  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-3 xl:grid-cols-2">
        <RecordList emptyLabel="No open assigned tasks right now." items={bundle.insights.tasks} title="Assigned tasks" />
        <RecordList
          emptyLabel="No urgent follow-up is currently assigned to you."
          items={bundle.insights.followUps}
          title="Follow-up queue"
        />
      </div>
      <TourList tours={bundle.insights.recommendedTours} />
      <SourcesList sources={bundle.sources} />
    </div>
  )
}

function CopilotMessage() {
  const isUser = useAuiState((state) => state.message.role === 'user')
  const messageText = useAuiState((state) => joinMessageText(state.message.content))
  const { applyFocusedText, canApplyFocusedText, focusedSession } = usePortalCopilot()

  return (
    <MessagePrimitive.Root className={cn('mb-4 flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex max-w-[88%] flex-col', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-3xl border px-4 py-3 shadow-sm',
            isUser
              ? 'border-primary/20 bg-primary text-primary-foreground'
              : 'border-border bg-card text-card-foreground',
          )}
        >
          <MessagePrimitive.Parts />
        </div>
        {!isUser && focusedSession?.type === 'text-generation' && canApplyFocusedText && messageText ? (
          <div className="mt-2">
            <Button
              onClick={() => applyFocusedText(messageText)}
              size="sm"
              type="button"
              variant="outline"
            >
              Apply to {focusedSession.fieldLabel}
            </Button>
          </div>
        ) : null}
        <CopilotMessagePanels />
      </div>
    </MessagePrimitive.Root>
  )
}

function EmptyState() {
  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-6 text-center">
      <p className="text-[0.68rem] uppercase tracking-[0.34em] text-muted-foreground">Employee copilot</p>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight">Ask what needs attention next</h2>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">
        The copilot can answer from approved internal docs, show your current tasks, surface stale follow-up, and launch the right guided tour.
      </p>
    </div>
  )
}

function buildCopilotContextBreadcrumbParts(
  authoringContext: CopilotAuthoringContext | null,
  focusedSession: CopilotFocusedSession | null,
): string[] {
  const parts: string[] = []

  if (authoringContext?.surface === 'media-library') {
    parts.push('Media library')
    if (authoringContext.libraryMedia) {
      parts.push(authoringContext.libraryMedia.label)
    }
    if (authoringContext.page) {
      parts.push(authoringContext.page.title || authoringContext.page.slug || authoringContext.page.pagePath)
    }
  } else if (authoringContext?.surface === 'page-composer') {
    if (authoringContext.page) {
      parts.push(authoringContext.page.title || authoringContext.page.slug || authoringContext.page.pagePath)
    }
    if (authoringContext.section) {
      parts.push(`Section ${authoringContext.section.index + 1}: ${authoringContext.section.label}`)
    }
    if (authoringContext.mediaSlot) {
      parts.push(authoringContext.mediaSlot.label)
    }
  }

  if (focusedSession?.type === 'media-generation' && COPILOT_MEDIA_GENERATION_ENABLED) {
    const mode = focusedSession.mode
    parts.push(
      mode === 'gallery' || mode === 'image' || mode === 'video' ? `Media · ${mode}` : 'Media session',
    )
  }

  if (focusedSession?.type === 'text-generation') {
    parts.push(`Rewrite · ${focusedSession.fieldLabel}`)
  }

  return parts
}

function CopilotContextBreadcrumb({
  authoringContext,
  focusedSession,
}: {
  authoringContext: CopilotAuthoringContext | null
  focusedSession: CopilotFocusedSession | null
}) {
  const parts = buildCopilotContextBreadcrumbParts(authoringContext, focusedSession)
  if (parts.length === 0) {
    return null
  }

  const line = parts.join(' / ')

  return (
    <p
      className="mx-auto w-full max-w-3xl truncate px-1 text-[0.7rem] leading-snug text-muted-foreground"
      title={line}
    >
      <span className="text-muted-foreground/70">context:</span>{' '}
      <span>{line}</span>
    </p>
  )
}

function MediaSessionFooterControls() {
  const { focusedSession, setFocusedSessionMode } = usePortalCopilot()
  const mediaSessionActive =
    COPILOT_MEDIA_GENERATION_ENABLED && focusedSession?.type === 'media-generation'

  if (!mediaSessionActive || focusedSession?.type !== 'media-generation') {
    return null
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-1.5 px-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[0.65rem] text-muted-foreground">Mode</span>
        <div className="flex flex-wrap gap-1.5">
          {(['image', 'video', 'gallery'] as const).map((mode) => (
            <Button
              key={mode}
              className="h-7 px-2.5 text-[0.65rem] capitalize"
              onClick={() => setFocusedSessionMode(mode)}
              size="sm"
              type="button"
              variant={focusedSession.mode === mode ? 'default' : 'outline'}
            >
              {mode}
            </Button>
          ))}
        </div>
      </div>
      {focusedSession.promptHint ? (
        <p className="truncate text-[0.65rem] text-muted-foreground" title={focusedSession.promptHint}>
          Draft: {focusedSession.promptHint}
        </p>
      ) : null}
    </div>
  )
}

function Composer() {
  const { focusedSession } = usePortalCopilot()
  const mediaSessionActive =
    COPILOT_MEDIA_GENERATION_ENABLED && focusedSession?.type === 'media-generation'

  return (
    <ComposerPrimitive.Root className="mx-auto flex w-full max-w-3xl flex-col gap-3 rounded-[1.75rem] border bg-card/95 p-3 shadow-lg">
      {mediaSessionActive && focusedSession?.type === 'media-generation' && !focusedSession.mode ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100">
          Choose image, video, or gallery above before asking for prompt or generation help.
        </div>
      ) : null}
      {focusedSession?.type === 'text-generation' ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground">
          Rewriting {focusedSession.fieldLabel}. Keep replies focused on improved copy for that field.
        </div>
      ) : null}
      <ComposerPrimitive.Input
        aria-label="Ask the employee copilot"
        className="min-h-[3.5rem] w-full resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground"
        maxRows={8}
        minRows={2}
        placeholder={
          mediaSessionActive && focusedSession?.type === 'media-generation'
            ? 'Ask for prompt options, shot direction, or generation refinements for the selected slot...'
            : focusedSession?.type === 'text-generation'
              ? `Rewrite ${focusedSession.fieldLabel.toLowerCase()} or ask for alternate versions...`
            : 'Ask about follow-up, quote policy, what to do next, or launch a tour...'
        }
      />
      <div className="flex items-center justify-between gap-3">
        <div className={cn('flex items-center gap-2', adminPanelChrome.fieldLabelWide)}>
          <SparklesIcon className="size-4" />
          Staff beta
        </div>
        <ComposerPrimitive.Send asChild>
          <Button aria-label="Send message" size="icon" type="button">
            <BotIcon className="size-4" />
          </Button>
        </ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  )
}

export function PortalCopilot({
  operatorTools = null,
}: {
  operatorTools?: null | SiteOperatorToolsPanelProps
}) {
  const pathname = usePathname()
  const composer = usePageComposerOptional()
  const { authoringContext, close, focusedSession, isOpen, open } = usePortalCopilot()
  const dragControls = useDragControls()
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [activeView, setActiveView] = useState<'chat' | 'tools'>('chat')
  const [corner, setCorner] = useState<Corner>('bottom-left')
  const [panelSize, setPanelSize] = useState({ height: 0, width: 0 })
  const hasToolsView = Boolean(
    operatorTools?.effectiveUser || operatorTools?.impersonatedUser || operatorTools?.realUser,
  )
  const hasSecondaryViews = hasToolsView
  const activeViewMeta = {
    chat: {
      description: 'Ask about work, docs, follow-up, and active staff context.',
      title: 'Copilot chat',
    },
    tools: {
      description: 'Jump between operator actions and impersonation context.',
      title: 'Operator tools',
    },
  }[activeView]

  const activeAuthoringContext =
    authoringContext?.surface !== 'page-composer' || authoringContext?.page?.pagePath === pathname
      ? authoringContext
      : null

  useEffect(() => {
    setCorner(readStoredCorner(defaultCornerForPath(pathname)))
  }, [pathname])

  useEffect(() => {
    if (activeView === 'tools' && !hasToolsView) {
      setActiveView('chat')
    }
  }, [activeView, hasToolsView])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (composer?.isOpen && composer.activeTab === 'pages' && hasToolsView) {
      setActiveView('tools')
      return
    }

    if (COPILOT_MEDIA_GENERATION_ENABLED && focusedSession?.type === 'media-generation') {
      setActiveView('chat')
    }
  }, [composer?.activeTab, composer?.isOpen, focusedSession?.type, hasToolsView, isOpen])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, corner)
  }, [corner])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    function syncSize() {
      const rect = panelRef.current?.getBoundingClientRect()
      if (!rect) {
        return
      }

      setPanelSize((current) => {
        const next = { height: Math.round(rect.height), width: Math.round(rect.width) }
        return current.height === next.height && current.width === next.width ? current : next
      })
    }

    syncSize()

    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            syncSize()
          })
        : null

    if (panelRef.current && observer) {
      observer.observe(panelRef.current)
    }

    window.addEventListener('resize', syncSize)

    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', syncSize)
    }
  }, [isOpen])

  const targetPosition = useMemo(
    () =>
      resolveCornerPosition({
        corner,
        height: panelSize.height,
        width: panelSize.width,
      }),
    [corner, panelSize.height, panelSize.width],
  )

  return (
    <motion.div
        ref={panelRef}
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        onDragEnd={() => {
          const rect = panelRef.current?.getBoundingClientRect()
          if (!rect) return

          setCorner(pickCornerFromRect(rect))
        }}
        className={`fixed left-0 top-0 ${isOpen ? 'z-[96] w-[min(34rem,calc(100vw-1.5rem))]' : 'z-[72] w-auto max-w-[calc(100vw-1.5rem)]'}`}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1, x: targetPosition.x, y: targetPosition.y }}
        transition={{
          opacity: { duration: 0.18, ease: 'easeOut' },
          scale: { duration: 0.18, ease: 'easeOut' },
          x: { type: 'spring', stiffness: 380, damping: 32 },
          y: { type: 'spring', stiffness: 380, damping: 32 },
        }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="open"
              className="relative grid h-[min(42rem,calc(100vh-1.5rem))] grid-cols-1 overflow-hidden rounded-[2rem] border bg-background shadow-2xl"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
            >
              <Button
                aria-label="Hide copilot"
                className="absolute right-4 top-4 z-10 h-9 w-9 rounded-full text-muted-foreground"
                onClick={close}
                size="icon"
                type="button"
                variant="ghost"
              >
                <XIcon className="size-4" />
              </Button>
              <header className="border-b px-5 py-4 pr-16">
                <div className="min-w-0">
                  <p className="text-[0.68rem] uppercase tracking-[0.3em] text-muted-foreground">Staff beta</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight">{activeViewMeta.title}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{activeViewMeta.description}</p>
                </div>
                {hasSecondaryViews ? (
                  <div className="mt-4 inline-flex rounded-full border border-border/70 bg-muted/40 p-1">
                    <button
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition',
                        activeView === 'chat' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
                      )}
                      onClick={() => setActiveView('chat')}
                      type="button"
                    >
                      <BotIcon className="size-4" />
                      Chat
                    </button>
                    {hasToolsView ? (
                      <button
                        className={cn(
                          'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition',
                          activeView === 'tools' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
                        )}
                        onClick={() => setActiveView('tools')}
                        type="button"
                      >
                        <SparklesIcon className="size-4" />
                        Tools
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </header>
              {activeView === 'tools' && hasToolsView ? (
                <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-5 sm:px-5">
                  <SiteOperatorToolsPanel
                    effectiveUser={operatorTools?.effectiveUser}
                    impersonatedUser={operatorTools?.impersonatedUser}
                    localPageMediaEnabled={operatorTools?.localPageMediaEnabled}
                    realUser={operatorTools?.realUser}
                  />
                </div>
              ) : (
                <ThreadPrimitive.Root className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-5 sm:px-5">
                  {COPILOT_MEDIA_GENERATION_ENABLED ? <CopilotMediaWorkbench /> : null}
                  <ThreadPrimitive.Viewport className="min-h-0 flex-1 overflow-y-auto px-1">
                    <ThreadPrimitive.Empty>
                      <EmptyState />
                    </ThreadPrimitive.Empty>
                    <ThreadPrimitive.Messages>
                      {() => <CopilotMessage />}
                    </ThreadPrimitive.Messages>
                  </ThreadPrimitive.Viewport>
                  <div className="flex flex-col gap-2 pt-4">
                    <CopilotContextBreadcrumb authoringContext={activeAuthoringContext} focusedSession={focusedSession} />
                    <MediaSessionFooterControls />
                    <Composer />
                  </div>
                </ThreadPrimitive.Root>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="closed"
              className="flex items-center gap-2 rounded-full border bg-primary px-3 py-2 text-primary-foreground shadow-lg"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
            >
              <DragHandle onPointerDown={(event) => dragControls.start(event)} />
              <button
                className="inline-flex items-center gap-2 rounded-full px-1 text-sm font-medium"
                onClick={open}
                type="button"
              >
                <LifeBuoyIcon className="size-4" />
                Copilot
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
  )
}
