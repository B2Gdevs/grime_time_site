import type { Step } from 'react-joyride'

/** Marketing-site tour IDs (Joyride in `SiteTourProvider`, not portal). */
export const SITE_TOUR_IDS = ['public-instant-quote'] as const
export type SiteTourId = (typeof SITE_TOUR_IDS)[number]

export type SiteTourDefinition = {
  id: SiteTourId
  label: string
  /** Only paths where targets exist (home has instant quote). */
  path: '/'
  steps: Step[]
}

const publicInstantQuoteSteps: Step[] = [
  {
    target: '[data-tour="public-instant-quote-hero"]',
    title: 'Instant quote',
    content:
      'Pick a service package and see how square footage, condition, and frequency shape the live range. This is a starting band — the team still confirms scope before work.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="public-instant-quote-form"]',
    title: 'Submit your request',
    content:
      'Add contact details and property info. Submitting sends the lead into our first-party workflow so staff can follow up with a scoped quote.',
    placement: 'left',
  },
]

export const siteTourRegistry: Record<SiteTourId, SiteTourDefinition> = {
  'public-instant-quote': {
    id: 'public-instant-quote',
    label: 'Instant quote (homepage)',
    path: '/',
    steps: publicInstantQuoteSteps,
  },
}

export function isSiteTourId(value: string | null | undefined): value is SiteTourId {
  return value === 'public-instant-quote'
}
