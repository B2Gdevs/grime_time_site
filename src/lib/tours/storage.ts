import type { PortalTourId } from './registry'

const STORAGE_KEY = 'grime_portal_tour_state_v1'

type TourStateV1 = {
  /** Tour IDs the user finished, skipped, or dismissed — we do not autolaunch those again. */
  seen: Record<string, true>
}

function load(): TourStateV1 {
  if (typeof window === 'undefined') return { seen: {} }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { seen: {} }
    const parsed = JSON.parse(raw) as TourStateV1
    return parsed?.seen ? parsed : { seen: {} }
  } catch {
    return { seen: {} }
  }
}

function save(state: TourStateV1) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

/** Mark any tour id as seen (portal or marketing site). */
export function markTourSeen(id: string) {
  const state = load()
  state.seen[id] = true
  save(state)
}

/** Mark a portal tour as seen (completed, skipped mid-flight, or closed). */
export function markPortalTourSeen(id: PortalTourId) {
  markTourSeen(id)
}

export function hasSeenTour(id: string): boolean {
  return !!load().seen[id]
}

export function hasSeenPortalTour(id: PortalTourId): boolean {
  return hasSeenTour(id)
}
