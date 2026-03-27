'use client'

import { createContext, useContext, type ReactNode } from 'react'

const ToursEnabledContext = createContext(false)

export function ToursEnabledProvider({
  children,
  enabled,
}: {
  children: ReactNode
  enabled: boolean
}) {
  return <ToursEnabledContext.Provider value={enabled}>{children}</ToursEnabledContext.Provider>
}

export function useToursEnabled(): boolean {
  return useContext(ToursEnabledContext)
}
