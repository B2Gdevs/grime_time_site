'use client'

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'

type PageComposerContextValue = {
  close: () => void
  isOpen: boolean
  open: () => void
  setOpen: (value: boolean) => void
  toggle: () => void
}

const PageComposerContext = createContext<null | PageComposerContextValue>(null)

export function PageComposerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((current) => !current), [])

  const value = useMemo(
    () => ({
      close,
      isOpen,
      open,
      setOpen: setIsOpen,
      toggle,
    }),
    [close, isOpen, open, toggle],
  )

  return <PageComposerContext.Provider value={value}>{children}</PageComposerContext.Provider>
}

export function usePageComposer() {
  const value = useContext(PageComposerContext)

  if (!value) {
    throw new Error('usePageComposer must be used within PageComposerProvider')
  }

  return value
}

export function usePageComposerOptional() {
  return useContext(PageComposerContext)
}
