export type InstantQuoteServiceKey =
  | 'house_wash'
  | 'driveway'
  | 'porch_patio'
  | 'dock'
  | 'dumpster_pad'

export type InstantQuoteCondition = 'light' | 'standard' | 'heavy'
export type InstantQuoteFrequency = 'one_time' | 'biannual' | 'quarterly'
export type InstantQuoteStories = '1' | '2' | '3+'

export type InstantQuoteService = {
  description: string
  enabledOnSite: boolean
  frequencyEligible: boolean
  key: InstantQuoteServiceKey
  label: string
  minimum: number
  priceBandLabel: string
  quoteEnabled: boolean
  recommendedFor: string
  sqftHighRate: number
  sqftLowRate: number
}

export const instantQuoteServices: InstantQuoteService[] = [
  {
    key: 'house_wash',
    label: 'House wash',
    description: 'Soft washing for siding, trim, soffits, and everyday organic buildup.',
    recommendedFor: 'Residential siding, trim, soffits, and curb-appeal cleanups.',
    priceBandLabel: '$0.12 to $0.20 / sq ft',
    sqftLowRate: 0.12,
    sqftHighRate: 0.2,
    minimum: 149,
    enabledOnSite: true,
    quoteEnabled: true,
    frequencyEligible: true,
  },
  {
    key: 'driveway',
    label: 'Driveway and flatwork',
    description: 'Concrete cleaning for driveways, walkways, patios, and entry pads.',
    recommendedFor: 'Driveways, sidewalks, patios, garage aprons, and pool decks.',
    priceBandLabel: '$0.10 to $0.18 / sq ft',
    sqftLowRate: 0.1,
    sqftHighRate: 0.18,
    minimum: 125,
    enabledOnSite: true,
    quoteEnabled: true,
    frequencyEligible: true,
  },
  {
    key: 'porch_patio',
    label: 'Porch or patio refresh',
    description: 'Smaller entertainment areas with railings, furniture movement, and detail work.',
    recommendedFor: 'Front porches, patios, steps, and mixed-surface outdoor living spaces.',
    priceBandLabel: '$0.14 to $0.24 / sq ft',
    sqftLowRate: 0.14,
    sqftHighRate: 0.24,
    minimum: 95,
    enabledOnSite: true,
    quoteEnabled: true,
    frequencyEligible: true,
  },
  {
    key: 'dock',
    label: 'Dock cleaning',
    description: 'Higher-risk flatwork with railings, stairs, algae, and water-side access.',
    recommendedFor: 'Boat docks, lakeside walkways, marina-adjacent residential surfaces.',
    priceBandLabel: '$0.20 to $0.32 / sq ft',
    sqftLowRate: 0.2,
    sqftHighRate: 0.32,
    minimum: 225,
    enabledOnSite: true,
    quoteEnabled: true,
    frequencyEligible: false,
  },
  {
    key: 'dumpster_pad',
    label: 'Dumpster pad and commercial grease area',
    description: 'Commercial work with grease severity, runoff controls, and recurrence planning.',
    recommendedFor: 'Future commercial growth, restaurant pads, rear service lanes, grease-heavy zones.',
    priceBandLabel: '$0.28 to $0.48 / sq ft',
    sqftLowRate: 0.28,
    sqftHighRate: 0.48,
    minimum: 275,
    enabledOnSite: true,
    quoteEnabled: false,
    frequencyEligible: true,
  },
]

const conditionMultiplier: Record<InstantQuoteCondition, number> = {
  light: 0.94,
  standard: 1,
  heavy: 1.22,
}

const storyMultiplier: Record<InstantQuoteStories, number> = {
  '1': 1,
  '2': 1.14,
  '3+': 1.3,
}

const frequencyMultiplier: Record<InstantQuoteFrequency, number> = {
  one_time: 1,
  biannual: 0.96,
  quarterly: 0.9,
}

export function getInstantQuoteService(serviceKey: InstantQuoteServiceKey): InstantQuoteService {
  return instantQuoteServices.find((service) => service.key === serviceKey) ?? instantQuoteServices[0]!
}

export function calculateInstantQuote(args: {
  condition: InstantQuoteCondition
  frequency: InstantQuoteFrequency
  serviceKey: InstantQuoteServiceKey
  sqft: number
  stories: InstantQuoteStories
}) {
  const service = getInstantQuoteService(args.serviceKey)
  const adjustedSqft = Number.isFinite(args.sqft) ? Math.max(0, args.sqft) : 0
  const multiplier =
    conditionMultiplier[args.condition] *
    storyMultiplier[args.stories] *
    (service.frequencyEligible ? frequencyMultiplier[args.frequency] : 1)

  const low = Math.max(service.minimum, adjustedSqft * service.sqftLowRate * multiplier)
  const high = Math.max(service.minimum, adjustedSqft * service.sqftHighRate * multiplier)

  return {
    high: Math.round(high),
    low: Math.round(low),
    multiplier,
    service,
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}
