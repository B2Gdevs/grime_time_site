'use client'

import {
  AuiProvider,
  AssistantRuntimeProvider,
  Interactables,
  useAui,
  useAuiState,
  useLocalRuntime,
  type ChatModelRunOptions,
} from '@assistant-ui/react'
import { usePathname } from 'next/navigation'
import {
  useEffect,
  useRef,
  type ReactNode,
} from 'react'

import type { CopilotApiResponse, CopilotConversationMessage } from '@/lib/ai'
import { useAssistantCloudClient } from '@/components/copilot/PortalCopilotThreadState'
import { usePortalCopilot } from '@/components/copilot/PortalCopilotContext'

const THREAD_STORAGE_KEY = 'portal-copilot-thread-id-v1'

type AssistantUiMessagePart = {
  text?: string
  type?: string
}

type AssistantUiMessageLike = {
  content?: readonly AssistantUiMessagePart[] | string
  role?: string
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

function PersistedThreadBridge() {
  const api = useAui()
  const currentRemoteThreadId = useAuiState((state) => state.threadListItem.remoteId ?? null)
  const restoredRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (restoredRef.current) {
      return
    }

    restoredRef.current = true
    const storedThreadId = window.localStorage.getItem(THREAD_STORAGE_KEY)

    if (!storedThreadId) {
      return
    }

    Promise.resolve(api.threads().switchToThread(storedThreadId)).catch(() => {
      window.localStorage.removeItem(THREAD_STORAGE_KEY)
    })
  }, [api])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (!currentRemoteThreadId) {
      return
    }

    window.localStorage.setItem(THREAD_STORAGE_KEY, currentRemoteThreadId)
  }, [currentRemoteThreadId])

  return null
}

export function PortalCopilotRuntimeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { authoringContext, focusedSession } = usePortalCopilot()
  const cloud = useAssistantCloudClient()

  const activeAuthoringContext =
    authoringContext?.surface !== 'page-composer' || authoringContext?.page?.pagePath === pathname
      ? authoringContext
      : null

  const runtime = useLocalRuntime(
    {
      run: async ({ abortSignal, context, messages = [] }: ChatModelRunOptions) => {
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
            modelContextSystem: context.system,
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

        return {
          content: [{ text: data.text, type: 'text' as const }],
          metadata: {
            custom: {
              insights: data.insights,
              query: data.query,
              sources: data.sources,
            },
          },
          status: { reason: 'stop' as const, type: 'complete' as const },
        }
      },
    },
    {
      cloud: cloud ?? undefined,
    },
  )

  const aui = useAui({
    interactables: Interactables(),
  })

  return (
    <AuiProvider value={aui}>
      <AssistantRuntimeProvider aui={aui} runtime={runtime}>
        <PersistedThreadBridge />
        {children}
      </AssistantRuntimeProvider>
    </AuiProvider>
  )
}
