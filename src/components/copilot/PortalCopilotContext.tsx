'use client'

import { COPILOT_MEDIA_GENERATION_ENABLED } from '@/constants/copilotFeatures'
import type { CopilotAuthoringContext, CopilotFocusedSession, CopilotFocusedSessionMode } from '@/lib/ai'
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react'

type PortalCopilotContextValue = {
  applyFocusedText: (value: string) => void
  authoringContext: CopilotAuthoringContext | null
  canApplyFocusedText: boolean
  close: () => void
  focusedSession: CopilotFocusedSession | null
  isOpen: boolean
  open: () => void
  openTools: () => void
  openFocusedMediaSession: (args?: { mode?: CopilotFocusedSessionMode | null; promptHint?: string }) => void
  openFocusedTextSession: (args: {
    applyText?: (value: string) => void
    currentText?: string
    fieldLabel: string
    fieldPath: string
    instructions?: string
  }) => void
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
    left.mediaSlot?.relationPath === right.mediaSlot?.relationPath &&
    left.libraryMedia?.id === right.libraryMedia?.id &&
    left.libraryMedia?.label === right.libraryMedia?.label &&
    left.libraryMedia?.mimeType === right.libraryMedia?.mimeType
  )
}

export function PortalCopilotProvider({ children }: { children: ReactNode }) {
  const [authoringContext, setAuthoringContextState] = useState<CopilotAuthoringContext | null>(null)
  const [focusedSession, setFocusedSession] = useState<CopilotFocusedSession | null>(null)
  const [focusedTextApplier, setFocusedTextApplier] = useState<null | ((value: string) => void)>(null)
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => {
    setIsOpen(false)
    setFocusedSession(null)
    setFocusedTextApplier(null)
  }, [])
  const openFocusedMediaSession = useCallback(
    (args?: { mode?: CopilotFocusedSessionMode | null; promptHint?: string }) => {
      if (!COPILOT_MEDIA_GENERATION_ENABLED) {
        return
      }
      setFocusedTextApplier(null)
      setFocusedSession({
        mode: args?.mode || null,
        promptHint: args?.promptHint?.trim() || undefined,
        type: 'media-generation',
      })
      setIsOpen(true)
    },
    [],
  )
  const openFocusedTextSession = useCallback(
    (args: {
      applyText?: (value: string) => void
      currentText?: string
      fieldLabel: string
      fieldPath: string
      instructions?: string
    }) => {
      setFocusedTextApplier(() => args.applyText || null)
      setFocusedSession({
        currentText: args.currentText?.trim() || undefined,
        fieldLabel: args.fieldLabel.trim(),
        fieldPath: args.fieldPath.trim(),
        instructions: args.instructions?.trim() || undefined,
        type: 'text-generation',
      })
      setIsOpen(true)
    },
    [],
  )
  const applyFocusedText = useCallback((value: string) => {
    const nextValue = value.trim()

    if (!nextValue || !focusedTextApplier) {
      return
    }

    focusedTextApplier(nextValue)
  }, [focusedTextApplier])
  const setFocusedSessionMode = useCallback((mode: CopilotFocusedSessionMode) => {
    if (!COPILOT_MEDIA_GENERATION_ENABLED) {
      return
    }
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
  const canApplyFocusedText = Boolean(focusedSession?.type === 'text-generation' && focusedTextApplier)

  useEffect(() => {
    if (!COPILOT_MEDIA_GENERATION_ENABLED) {
      setFocusedSession((current) => (current?.type === 'media-generation' ? null : current))
    }
  }, [])

  const setAuthoringContext = useCallback((value: CopilotAuthoringContext | null) => {
    setAuthoringContextState((current) => (sameAuthoringContext(current, value) ? current : value))
  }, [])

  const value = {
    applyFocusedText,
    authoringContext,
    canApplyFocusedText,
    close,
    focusedSession,
    isOpen,
    open,
    openTools: open,
    openFocusedMediaSession,
    openFocusedTextSession,
    setAuthoringContext,
    setFocusedSessionMode,
  }

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
