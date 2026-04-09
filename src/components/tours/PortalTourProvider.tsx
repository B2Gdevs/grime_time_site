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

import {
  isPortalTourId,
  portalTourRegistry,
  type PortalTourId,
} from '@/lib/tours/registry'
import { OPS_DASHBOARD_PATH } from '@/lib/navigation/portalPaths'
import { hasSeenPortalTour, markTourSeen } from '@/lib/tours/storage'

const SESSION_AUTO_OPS_KEY = 'grime_portal_session_autolaunch_ops_v1'

type PortalTourContextValue = {
  startTour: (id: PortalTourId) => void
  stopTour: () => void
  activeTourId: PortalTourId | null
  running: boolean
}

const PortalTourContext = createContext<PortalTourContextValue | null>(null)

export function usePortalTour(): PortalTourContextValue {
  const ctx = useContext(PortalTourContext)
  if (!ctx) {
    throw new Error('usePortalTour must be used within PortalTourProvider')
  }
  return ctx
}

function TourSyncFromUrl({
  onTourFromQuery,
}: {
  onTourFromQuery: (id: PortalTourId) => void
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const raw = searchParams.get('tour')
    if (!isPortalTourId(raw)) return

    onTourFromQuery(raw)

    const next = new URLSearchParams(searchParams.toString())
    next.delete('tour')
    const q = next.toString()
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false })
  }, [onTourFromQuery, pathname, router, searchParams])

  return null
}

function StaffOpsAutolaunch({
  isRealAdmin,
  startTour,
  toursEnabled,
}: {
  isRealAdmin: boolean
  startTour: (id: PortalTourId) => void
  toursEnabled: boolean
}) {
  const pathname = usePathname()
  const autolaunchOnce = useRef(false)

  useEffect(() => {
    if (!toursEnabled || !isRealAdmin || pathname !== OPS_DASHBOARD_PATH) return
    if (!portalTourRegistry['ops-dashboard'].staffAutolaunch) return
    if (hasSeenPortalTour('ops-dashboard')) return
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_AUTO_OPS_KEY)) return
    if (autolaunchOnce.current) return
    autolaunchOnce.current = true
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_AUTO_OPS_KEY, '1')
    }
    startTour('ops-dashboard')
  }, [isRealAdmin, pathname, startTour, toursEnabled])

  return null
}

function PortalTourProviderInner({
  children,
  isRealAdmin,
  toursEnabled,
}: {
  children: ReactNode
  isRealAdmin: boolean
  toursEnabled: boolean
}) {
  const [run, setRun] = useState(false)
  const [activeTourId, setActiveTourId] = useState<PortalTourId | null>(null)
  const activeTourIdRef = useRef<PortalTourId | null>(null)

  useEffect(() => {
    activeTourIdRef.current = activeTourId
  }, [activeTourId])

  const startTour = useCallback(
    (id: PortalTourId) => {
      if (!toursEnabled) return
      if (!portalTourRegistry[id]) return
      setActiveTourId(id)
      setRun(true)
    },
    [toursEnabled],
  )

  const stopTour = useCallback(() => {
    const id = activeTourIdRef.current
    if (id) markTourSeen(id)
    setRun(false)
    setActiveTourId(null)
  }, [])

  const onTourFromQuery = useCallback((id: PortalTourId) => {
    startTour(id)
  }, [startTour])

  const steps = useMemo(() => {
    if (!activeTourId) return []
    return portalTourRegistry[activeTourId]?.steps ?? []
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
    (): PortalTourContextValue => ({
      startTour,
      stopTour,
      activeTourId,
      running: run,
    }),
    [activeTourId, run, startTour, stopTour],
  )

  return (
    <PortalTourContext.Provider value={ctx}>
      <Suspense fallback={null}>
        <TourSyncFromUrl onTourFromQuery={onTourFromQuery} />
      </Suspense>
      <Suspense fallback={null}>
        <StaffOpsAutolaunch isRealAdmin={isRealAdmin} startTour={startTour} toursEnabled={toursEnabled} />
      </Suspense>
      {children}
      <Joyride
        run={run && steps.length > 0}
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
    </PortalTourContext.Provider>
  )
}

export function PortalTourProvider({
  children,
  isRealAdmin,
  toursEnabled,
}: {
  children: ReactNode
  /** True when the signed-in account is a real admin (Payload staff), not impersonation-only. */
  isRealAdmin: boolean
  /** Joyride only when demo persona or admin demo mode. */
  toursEnabled: boolean
}) {
  return (
    <PortalTourProviderInner isRealAdmin={isRealAdmin} toursEnabled={toursEnabled}>
      {children}
    </PortalTourProviderInner>
  )
}
