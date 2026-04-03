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

export function PortalCopilotProvider({ children }: { children: ReactNode }) {
  const [authoringContext, setAuthoringContext] = useState<CopilotAuthoringContext | null>(null)
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
    [authoringContext, close, focusedSession, isOpen, open, openFocusedMediaSession, setFocusedSessionMode],
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
