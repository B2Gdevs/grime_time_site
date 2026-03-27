'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { DEMO_QUERY_PARAM, GRIME_DEMO_MODE_KEY } from '@/lib/demo/constants'

type DemoModeContextValue = {
  demoMode: boolean
  setDemoMode: (next: boolean) => void
}

const DemoModeContext = createContext<DemoModeContextValue | null>(null)

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

function writeDemoCookie(value: boolean) {
  if (typeof document === 'undefined') return
  const maxAge = 60 * 60 * 24 * 365
  document.cookie = `${GRIME_DEMO_MODE_KEY}=${value ? '1' : '0'}; path=/; max-age=${maxAge}; SameSite=Lax`
  try {
    window.localStorage.setItem(GRIME_DEMO_MODE_KEY, value ? '1' : '0')
  } catch {
    /* ignore */
  }
}

function DemoModeUrlSync() {
  const searchParams = useSearchParams()
  const { setDemoMode } = useDemoMode()

  useEffect(() => {
    const raw = searchParams.get(DEMO_QUERY_PARAM)
    if (raw === '1' || raw === 'true') {
      setDemoMode(true)
    }
  }, [searchParams, setDemoMode])

  return null
}

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [demoMode, setDemoModeState] = useState(false)

  useEffect(() => {
    const fromCookie = readCookie(GRIME_DEMO_MODE_KEY)
    const fromStorage =
      typeof window !== 'undefined' ? window.localStorage.getItem(GRIME_DEMO_MODE_KEY) : null
    if (fromCookie === '1' || fromStorage === '1') {
      setDemoModeState(true)
    }
  }, [])

  const setDemoMode = useCallback((next: boolean) => {
    setDemoModeState(next)
    writeDemoCookie(next)
  }, [])

  const value = useMemo(
    (): DemoModeContextValue => ({
      demoMode,
      setDemoMode,
    }),
    [demoMode, setDemoMode],
  )

  return (
    <DemoModeContext.Provider value={value}>
      <Suspense fallback={null}>
        <DemoModeUrlSync />
      </Suspense>
      {children}
    </DemoModeContext.Provider>
  )
}

export function useDemoMode(): DemoModeContextValue {
  const ctx = useContext(DemoModeContext)
  if (!ctx) {
    throw new Error('useDemoMode must be used within DemoModeProvider')
  }
  return ctx
}

/** Optional: portal shell when `DemoModeProvider` is not mounted (should not happen). */
export function useDemoModeOptional(): DemoModeContextValue | null {
  return useContext(DemoModeContext)
}
