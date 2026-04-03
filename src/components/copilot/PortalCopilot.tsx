'use client'

import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  type ChatModelRunOptions,
  useAuiState,
  useLocalRuntime,
} from '@assistant-ui/react'
import { BotIcon, LifeBuoyIcon, SparklesIcon, XIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react'

import type { CopilotApiResponse, CopilotConversationMessage } from '@/lib/ai'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'

import { usePortalCopilot } from './PortalCopilotContext'
import { RecordList, SourcesList, TourList, type CopilotBundle } from './PortalCopilotPanels'

type AssistantUiMessagePart = {
  text?: string
  type?: string
}

type AssistantUiMessageLike = {
  content?: readonly AssistantUiMessagePart[] | string
  role?: string
}

type CopilotMessagePanelsProps = {
  panelsByMessageId: Record<string, CopilotBundle>
  pendingBundle: CopilotBundle | null
  setPanelsByMessageId: Dispatch<SetStateAction<Record<string, CopilotBundle>>>
  setPendingBundle: Dispatch<SetStateAction<CopilotBundle | null>>
}

function joinMessageText(content: AssistantUiMessageLike['content']) {
  if (typeof content === 'string') return content.trim()
  if (!Array.isArray(content)) return ''

  return content
    .map((part) => (part?.type === 'text' && typeof part.text === 'string' ? part.text : ''))
    .join('')
    .trim()
}

function normalizeConversation(messages: readonly AssistantUiMessageLike[] | undefined): CopilotConversationMessage[] {
  return (messages ?? [])
    .map((message) => {
      const role = message?.role
      const content = joinMessageText(message?.content)
      if (!content) return null
      if (role !== 'assistant' && role !== 'system' && role !== 'user') return null
      return {
        content,
        role,
      } satisfies CopilotConversationMessage
    })
    .filter((message): message is CopilotConversationMessage => Boolean(message))
}

function CopilotMessagePanels({
  panelsByMessageId,
  pendingBundle,
  setPanelsByMessageId,
  setPendingBundle,
}: CopilotMessagePanelsProps) {
  const messageId = useAuiState((state) => state.message.id)
  const isAssistant = useAuiState((state) => state.message.role === 'assistant')
  const isLastMessage = useAuiState((state) => state.message.index === state.thread.messages.length - 1)

  useEffect(() => {
    if (!isAssistant || !messageId || !pendingBundle) return

    setPanelsByMessageId((current) => {
      if (current[messageId]) return current
      return {
        ...current,
        [messageId]: pendingBundle,
      }
    })

    setPendingBundle((current) => (current === pendingBundle ? null : current))
  }, [isAssistant, messageId, pendingBundle, setPanelsByMessageId, setPendingBundle])

  if (!isAssistant) return null

  const bundle =
    (messageId ? panelsByMessageId[messageId] : undefined) ??
    (isLastMessage ? pendingBundle ?? undefined : undefined)
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

function CopilotMessage(props: CopilotMessagePanelsProps) {
  const isUser = useAuiState((state) => state.message.role === 'user')

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
        <CopilotMessagePanels {...props} />
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

function AuthoringContextSummary({
  authoringContext,
  focusedSession,
}: {
  authoringContext: ReturnType<typeof usePortalCopilot>['authoringContext']
  focusedSession: ReturnType<typeof usePortalCopilot>['focusedSession']
}) {
  const { setFocusedSessionMode } = usePortalCopilot()

  if (!authoringContext && !focusedSession) {
    return null
  }

  return (
    <div className="mx-auto mb-4 flex w-full max-w-3xl flex-col gap-3 rounded-[1.75rem] border bg-card/80 p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">Authoring context</Badge>
        {authoringContext?.page ? <Badge variant="secondary">{authoringContext.page.pagePath}</Badge> : null}
        {authoringContext?.section ? <Badge variant="secondary">{authoringContext.section.label}</Badge> : null}
        {authoringContext?.mediaSlot ? <Badge variant="secondary">{authoringContext.mediaSlot.label}</Badge> : null}
      </div>

      {authoringContext?.page ? (
        <div className="grid gap-1 text-sm text-muted-foreground">
          <div className="font-medium text-foreground">{authoringContext.page.title}</div>
          <div>
            {authoringContext.page.status} • {authoringContext.page.visibility} • {authoringContext.page.slug}
          </div>
        </div>
      ) : null}

      {authoringContext?.section ? (
        <div className="rounded-2xl border border-border/70 bg-background/70 p-3 text-sm">
          <div className="font-medium text-foreground">
            Section {authoringContext.section.index + 1}: {authoringContext.section.label}
          </div>
          <div className="mt-1 text-muted-foreground">
            {authoringContext.section.blockType}
            {authoringContext.section.variant ? ` • ${authoringContext.section.variant}` : ''}
            {authoringContext.section.description ? ` • ${authoringContext.section.description}` : ''}
          </div>
        </div>
      ) : null}

      {focusedSession?.type === 'media-generation' ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-foreground">Focused media session</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Pick a mode before asking for generation help so the copilot stays scoped to the selected slot.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['image', 'video', 'gallery'] as const).map((mode) => (
                <Button
                  key={mode}
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
            <div className="mt-3 rounded-2xl border border-border/70 bg-background/80 p-3 text-sm text-muted-foreground">
              Draft prompt: {focusedSession.promptHint}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function Composer() {
  const { focusedSession } = usePortalCopilot()

  return (
    <ComposerPrimitive.Root className="mx-auto flex w-full max-w-3xl flex-col gap-3 rounded-[1.75rem] border bg-card/95 p-3 shadow-lg">
      {focusedSession?.type === 'media-generation' && !focusedSession.mode ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100">
          Choose image, video, or gallery above before asking for prompt or generation help.
        </div>
      ) : null}
      <ComposerPrimitive.Input
        aria-label="Ask the employee copilot"
        className="min-h-[3.5rem] w-full resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground"
        maxRows={8}
        minRows={2}
        placeholder={
          focusedSession?.type === 'media-generation'
            ? 'Ask for prompt options, shot direction, or generation refinements for the selected slot...'
            : 'Ask about follow-up, quote policy, what to do next, or launch a tour...'
        }
      />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
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

export function PortalCopilot() {
  const pathname = usePathname()
  const { authoringContext, close, focusedSession, isOpen, open } = usePortalCopilot()
  const [pendingBundle, setPendingBundle] = useState<CopilotBundle | null>(null)
  const [panelsByMessageId, setPanelsByMessageId] = useState<Record<string, CopilotBundle>>({})

  const activeAuthoringContext =
    authoringContext?.surface !== 'page-composer' || authoringContext?.page?.pagePath === pathname
      ? authoringContext
      : null

  const runtime = useLocalRuntime(
    {
      run: async ({ abortSignal, messages = [] }: ChatModelRunOptions) => {
        const conversation = normalizeConversation(messages as readonly AssistantUiMessageLike[])
        const latestUserMessage = [...conversation].reverse().find((message) => message.role === 'user')
        if (!latestUserMessage) {
          return {
            content: [{ text: 'Ask a question about work, follow-up, or internal docs first.', type: 'text' as const }],
            status: { reason: 'stop' as const, type: 'complete' as const },
          }
        }

        const response = await fetch('/api/internal/ai/copilot', {
          body: JSON.stringify({
            authoringContext: activeAuthoringContext,
            currentPath: pathname,
            focusedSession,
            messages: conversation,
          }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
          signal: abortSignal,
        })

        const data = (await response.json().catch(() => null)) as CopilotApiResponse | { error?: string } | null
        if (!response.ok || !data || !('text' in data)) {
          const message =
            data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
              ? data.error
              : 'The employee copilot request failed.'
          throw new Error(message)
        }

        setPendingBundle({
          insights: data.insights,
          query: data.query,
          sources: data.sources,
        })

        return {
          content: [{ text: data.text, type: 'text' as const }],
          status: { reason: 'stop' as const, type: 'complete' as const },
        }
      },
    },
    {},
  )

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <button
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
        onClick={open}
        type="button"
      >
        <LifeBuoyIcon className="size-4" />
        Copilot
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/20 p-3 backdrop-blur-[2px] sm:p-6">
          <div className="grid h-[min(46rem,calc(100vh-1.5rem))] w-full max-w-[min(58rem,calc(100vw-1.5rem))] grid-cols-1 overflow-hidden rounded-[2rem] border bg-background shadow-2xl">
            <header className="flex items-center justify-between gap-3 border-b px-5 py-4">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.3em] text-muted-foreground">Staff beta</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">Grime Time Copilot</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Internal docs, assigned tasks, stale follow-up, tour launchers, and page-authoring context in one panel.
                </p>
              </div>
              <button
                aria-label="Close employee copilot"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border text-muted-foreground transition hover:bg-accent"
                onClick={close}
                type="button"
              >
                <XIcon className="size-4" />
              </button>
            </header>
            <ThreadPrimitive.Root className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-5 sm:px-5">
              <AuthoringContextSummary authoringContext={activeAuthoringContext} focusedSession={focusedSession} />
              <ThreadPrimitive.Viewport className="min-h-0 flex-1 overflow-y-auto px-1">
                <ThreadPrimitive.Empty>
                  <EmptyState />
                </ThreadPrimitive.Empty>
                <ThreadPrimitive.Messages>
                  {() => (
                    <CopilotMessage
                      panelsByMessageId={panelsByMessageId}
                      pendingBundle={pendingBundle}
                      setPanelsByMessageId={setPanelsByMessageId}
                      setPendingBundle={setPendingBundle}
                    />
                  )}
                </ThreadPrimitive.Messages>
              </ThreadPrimitive.Viewport>
              <div className="pt-4">
                <Composer />
              </div>
            </ThreadPrimitive.Root>
          </div>
        </div>
      ) : null}
    </AssistantRuntimeProvider>
  )
}
