'use client'

import type { CopilotAuthoringContext, CopilotFocusedSession, CopilotFocusedSessionMode } from '@/lib/ai'
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'

type PortalCopilotContextValue = {
  authoringContext: CopilotAuthoringContext | null
  close: () => void
  focusedSession: CopilotFocusedSession | null
  isOpen: boolean
  open: () => void
  openFocusedMediaSession: (args?: { mode?: CopilotFocusedSessionMode | null; promptHint?: string }) => void
  setAuthoringContext: (value: CopilotAuthoringContext | null) => void
  setFocusedSessionMode: (mode: CopilotFocusedSessionMode) => void
}

const PortalCopilotContext = createContext<null | PortalCopilotContextValue>(null)

function sameAuthoringContext(
  left: CopilotAuthoringContext | null,
  right: CopilotAuthoringContext | null,
): boolean {
  if (left === right) {
    return true
  }

  if (!left || !right) {
    return false
  }

  return (
    left.surface === right.surface &&
    left.page?.id === right.page?.id &&
    left.page?.pagePath === right.page?.pagePath &&
    left.page?.slug === right.page?.slug &&
    left.page?.status === right.page?.status &&
    left.page?.title === right.page?.title &&
    left.page?.visibility === right.page?.visibility &&
    left.section?.blockType === right.section?.blockType &&
    left.section?.description === right.section?.description &&
    left.section?.index === right.section?.index &&
    left.section?.label === right.section?.label &&
    left.section?.variant === right.section?.variant &&
    left.mediaSlot?.label === right.mediaSlot?.label &&
    left.mediaSlot?.mediaId === right.mediaSlot?.mediaId &&
    left.mediaSlot?.mimeType === right.mediaSlot?.mimeType &&
    left.mediaSlot?.relationPath === right.mediaSlot?.relationPath
  )
}

export function PortalCopilotProvider({ children }: { children: ReactNode }) {
  const [authoringContext, setAuthoringContextState] = useState<CopilotAuthoringContext | null>(null)
  const [focusedSession, setFocusedSession] = useState<CopilotFocusedSession | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => {
    setIsOpen(false)
    setFocusedSession(null)
  }, [])
  const openFocusedMediaSession = useCallback(
    (args?: { mode?: CopilotFocusedSessionMode | null; promptHint?: string }) => {
      setFocusedSession({
        mode: args?.mode || null,
        promptHint: args?.promptHint?.trim() || undefined,
        type: 'media-generation',
      })
      setIsOpen(true)
    },
    [],
  )
  const setFocusedSessionMode = useCallback((mode: CopilotFocusedSessionMode) => {
    setFocusedSession((current) =>
      current?.type === 'media-generation'
        ? {
            ...current,
            mode,
          }
        : {
            mode,
            type: 'media-generation',
          },
    )
  }, [])
  const setAuthoringContext = useCallback((value: CopilotAuthoringContext | null) => {
    setAuthoringContextState((current) => (sameAuthoringContext(current, value) ? current : value))
  }, [])

  const value = useMemo(
    () => ({
      authoringContext,
      close,
      focusedSession,
      isOpen,
      open,
      openFocusedMediaSession,
      setAuthoringContext,
      setFocusedSessionMode,
    }),
    [authoringContext, close, focusedSession, isOpen, open, openFocusedMediaSession, setAuthoringContext, setFocusedSessionMode],
  )

  return <PortalCopilotContext.Provider value={value}>{children}</PortalCopilotContext.Provider>
}

export function usePortalCopilot() {
  const value = useContext(PortalCopilotContext)
  if (!value) {
    throw new Error('usePortalCopilot must be used within PortalCopilotProvider')
  }
  return value
}

export function usePortalCopilotOptional() {
  return useContext(PortalCopilotContext)
}
