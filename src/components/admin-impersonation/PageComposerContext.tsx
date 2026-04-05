'use client'

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'

export type PageComposerCanvasMode = 'desktop' | 'mobile' | 'tablet'

type PageComposerContextValue = {
  activePagePath: null | string
  close: () => void
  isOpen: boolean
  open: () => void
  previewMode: PageComposerCanvasMode
  selectedIndex: number
  setActivePagePath: (value: null | string) => void
  setOpen: (value: boolean) => void
  setPreviewMode: (value: PageComposerCanvasMode) => void
  setSelectedIndex: (value: number) => void
  toggle: () => void
}

const PageComposerContext = createContext<null | PageComposerContextValue>(null)

export function PageComposerProvider({ children }: { children: ReactNode }) {
  const [activePagePath, setActivePagePath] = useState<null | string>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState<PageComposerCanvasMode>('desktop')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => {
    setIsOpen(false)
    setActivePagePath(null)
  }, [])
  const toggle = useCallback(() => setIsOpen((current) => !current), [])

  const value = useMemo(
    () => ({
      activePagePath,
      close,
      isOpen,
      open,
      previewMode,
      selectedIndex,
      setActivePagePath,
      setOpen: setIsOpen,
      setPreviewMode,
      setSelectedIndex,
      toggle,
    }),
    [activePagePath, close, isOpen, open, previewMode, selectedIndex, toggle],
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
