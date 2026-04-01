'use client'

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'

type PortalCopilotContextValue = {
  close: () => void
  isOpen: boolean
  open: () => void
}

const PortalCopilotContext = createContext<null | PortalCopilotContextValue>(null)

export function PortalCopilotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  const value = useMemo(
    () => ({
      close,
      isOpen,
      open,
    }),
    [close, isOpen, open],
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
