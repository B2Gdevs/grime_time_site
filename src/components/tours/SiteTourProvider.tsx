'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { EVENTS, Joyride, STATUS, type EventData } from 'react-joyride'

import { isSiteTourEnabled } from '@/lib/demo/tourAccess'
import { isSiteTourId, siteTourRegistry, type SiteTourId } from '@/lib/tours/site-registry'
import { markTourSeen } from '@/lib/tours/storage'
import { useDemoMode } from '@/providers/DemoModeProvider'

type SiteTourContextValue = {
  startTour: (id: SiteTourId) => void
  stopTour: () => void
  activeTourId: SiteTourId | null
  running: boolean
}

const SiteTourContext = createContext<SiteTourContextValue | null>(null)

export function useSiteTour(): SiteTourContextValue {
  const ctx = useContext(SiteTourContext)
  if (!ctx) {
    throw new Error('useSiteTour must be used within SiteTourProvider')
  }
  return ctx
}

function SiteTourSyncFromUrl({ onTourFromQuery }: { onTourFromQuery: (id: SiteTourId) => void }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const raw = searchParams.get('tour')
    if (!isSiteTourId(raw)) return

    onTourFromQuery(raw)

    const next = new URLSearchParams(searchParams.toString())
    next.delete('tour')
    const q = next.toString()
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false })

    if (raw === 'public-instant-quote') {
      requestAnimationFrame(() => {
        document.getElementById('instant-quote')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [onTourFromQuery, pathname, router, searchParams])

  return null
}

function SiteTourProviderInner({
  children,
  siteToursOn,
}: {
  children: ReactNode
  siteToursOn: boolean
}) {
  const [run, setRun] = useState(false)
  const [activeTourId, setActiveTourId] = useState<SiteTourId | null>(null)
  const activeTourIdRef = useRef<SiteTourId | null>(null)

  useEffect(() => {
    activeTourIdRef.current = activeTourId
  }, [activeTourId])

  const startTour = useCallback(
    (id: SiteTourId) => {
      if (!siteToursOn) return
      if (!siteTourRegistry[id]) return
      setActiveTourId(id)
      setRun(true)
    },
    [siteToursOn],
  )

  const stopTour = useCallback(() => {
    const id = activeTourIdRef.current
    if (id) markTourSeen(id)
    setRun(false)
    setActiveTourId(null)
  }, [])

  const onTourFromQuery = useCallback(
    (id: SiteTourId) => {
      startTour(id)
    },
    [startTour],
  )

  const steps = useMemo(() => {
    if (!activeTourId) return []
    return siteTourRegistry[activeTourId]?.steps ?? []
  }, [activeTourId])

  const onEvent = useCallback((data: EventData) => {
    if (data.type === EVENTS.TARGET_NOT_FOUND || data.type === EVENTS.ERROR) {
      const id = activeTourIdRef.current
      if (id) markTourSeen(id)
      setRun(false)
      setActiveTourId(null)
      return
    }
    if (
      data.type === EVENTS.TOUR_END ||
      data.status === STATUS.FINISHED ||
      data.status === STATUS.SKIPPED
    ) {
      const id = activeTourIdRef.current
      if (id) markTourSeen(id)
      setRun(false)
      setActiveTourId(null)
    }
  }, [])

  const ctx = useMemo(
    (): SiteTourContextValue => ({
      startTour,
      stopTour,
      activeTourId,
      running: run,
    }),
    [activeTourId, run, startTour, stopTour],
  )

  return (
    <SiteTourContext.Provider value={ctx}>
      <Suspense fallback={null}>
        <SiteTourSyncFromUrl onTourFromQuery={onTourFromQuery} />
      </Suspense>
      {children}
      <Joyride
        run={siteToursOn && run && steps.length > 0}
        steps={steps}
        continuous
        scrollToFirstStep
        options={{
          zIndex: 10000,
          showProgress: true,
          buttons: ['back', 'close', 'primary', 'skip'],
        }}
        onEvent={onEvent}
      />
    </SiteTourContext.Provider>
  )
}

export function SiteTourProvider({ children }: { children: ReactNode }) {
  const { demoMode } = useDemoMode()
  const siteToursOn = isSiteTourEnabled(demoMode)

  return <SiteTourProviderInner siteToursOn={siteToursOn}>{children}</SiteTourProviderInner>
}
