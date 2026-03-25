export const instantQuoteServiceKeys = [
  'house_wash',
  'driveway',
  'porch_patio',
  'dock',
  'dumpster_pad',
] as const

export type InstantQuoteServiceKey = (typeof instantQuoteServiceKeys)[number]
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
  sortOrder: number
  sqftHighRate: number
  sqftLowRate: number
}

export type InstantQuoteCatalog = {
  conditionMultipliers: Record<InstantQuoteCondition, number>
  frequencyMultipliers: Record<InstantQuoteFrequency, number>
  services: InstantQuoteService[]
  storyMultipliers: Record<InstantQuoteStories, number>
}

const defaultServices: InstantQuoteService[] = [
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
    sortOrder: 10,
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
    sortOrder: 20,
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
    sortOrder: 30,
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
    sortOrder: 40,
  },
  {
    key: 'dumpster_pad',
    label: 'Dumpster pad and commercial grease area',
    description: 'Commercial work with grease severity, runoff controls, and recurrence planning.',
    recommendedFor: 'Restaurant pads, rear service lanes, grease-heavy zones, and future commercial work.',
    priceBandLabel: '$0.28 to $0.48 / sq ft',
    sqftLowRate: 0.28,
    sqftHighRate: 0.48,
    minimum: 275,
    enabledOnSite: true,
    quoteEnabled: false,
    frequencyEligible: true,
    sortOrder: 50,
  },
]

export const defaultInstantQuoteCatalog: InstantQuoteCatalog = {
  services: defaultServices,
  conditionMultipliers: {
    light: 0.94,
    standard: 1,
    heavy: 1.22,
  },
  storyMultipliers: {
    '1': 1,
    '2': 1.14,
    '3+': 1.3,
  },
  frequencyMultipliers: {
    one_time: 1,
    biannual: 0.96,
    quarterly: 0.9,
  },
}

function serviceBandLabel(low: number, high: number): string {
  return `$${low.toFixed(2)} to $${high.toFixed(2)} / sq ft`
}

export function normalizeInstantQuoteCatalog(
  partial?: Partial<InstantQuoteCatalog> | null,
): InstantQuoteCatalog {
  const fallbackByKey = new Map(defaultServices.map((service) => [service.key, service]))
  const incoming = partial?.services ?? []
  const mergedServices = instantQuoteServiceKeys
    .map((serviceKey) => {
      const fallback = fallbackByKey.get(serviceKey)!
      const next = incoming.find((service) => service?.key === serviceKey)
      const lowRate = next?.sqftLowRate ?? fallback.sqftLowRate
      const highRate = next?.sqftHighRate ?? fallback.sqftHighRate

      return {
        ...fallback,
        ...next,
        key: serviceKey,
        minimum: next?.minimum ?? fallback.minimum,
        sortOrder: next?.sortOrder ?? fallback.sortOrder,
        sqftHighRate: highRate,
        sqftLowRate: lowRate,
        priceBandLabel: next?.priceBandLabel?.trim() || serviceBandLabel(lowRate, highRate),
      }
    })
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return {
    services: mergedServices,
    conditionMultipliers: {
      light: partial?.conditionMultipliers?.light ?? defaultInstantQuoteCatalog.conditionMultipliers.light,
      standard:
        partial?.conditionMultipliers?.standard ?? defaultInstantQuoteCatalog.conditionMultipliers.standard,
      heavy: partial?.conditionMultipliers?.heavy ?? defaultInstantQuoteCatalog.conditionMultipliers.heavy,
    },
    storyMultipliers: {
      '1': partial?.storyMultipliers?.['1'] ?? defaultInstantQuoteCatalog.storyMultipliers['1'],
      '2': partial?.storyMultipliers?.['2'] ?? defaultInstantQuoteCatalog.storyMultipliers['2'],
      '3+': partial?.storyMultipliers?.['3+'] ?? defaultInstantQuoteCatalog.storyMultipliers['3+'],
    },
    frequencyMultipliers: {
      one_time:
        partial?.frequencyMultipliers?.one_time ?? defaultInstantQuoteCatalog.frequencyMultipliers.one_time,
      biannual:
        partial?.frequencyMultipliers?.biannual ?? defaultInstantQuoteCatalog.frequencyMultipliers.biannual,
      quarterly:
        partial?.frequencyMultipliers?.quarterly ?? defaultInstantQuoteCatalog.frequencyMultipliers.quarterly,
    },
  }
}

export function getInstantQuoteService(
  serviceKey: InstantQuoteServiceKey,
  catalog: InstantQuoteCatalog = defaultInstantQuoteCatalog,
): InstantQuoteService {
  return catalog.services.find((service) => service.key === serviceKey) ?? catalog.services[0]!
}

export function getInstantQuoteEnabledServices(
  catalog: InstantQuoteCatalog = defaultInstantQuoteCatalog,
): InstantQuoteService[] {
  return catalog.services.filter((service) => service.enabledOnSite && service.quoteEnabled)
}

export function getDefaultInstantQuoteServiceKey(
  catalog: InstantQuoteCatalog = defaultInstantQuoteCatalog,
): InstantQuoteServiceKey {
  return getInstantQuoteEnabledServices(catalog)[0]?.key ?? defaultInstantQuoteCatalog.services[0]!.key
}

export function buildInstantQuoteServiceOptions(
  catalog: InstantQuoteCatalog = defaultInstantQuoteCatalog,
) {
  return getInstantQuoteEnabledServices(catalog).map((service) => ({
    label: service.label,
    value: service.key,
  }))
}

export function calculateInstantQuote(
  args: {
    condition: InstantQuoteCondition
    frequency: InstantQuoteFrequency
    serviceKey: InstantQuoteServiceKey
    sqft: number
    stories: InstantQuoteStories
  },
  catalog: InstantQuoteCatalog = defaultInstantQuoteCatalog,
) {
  const service = getInstantQuoteService(args.serviceKey, catalog)
  const adjustedSqft = Number.isFinite(args.sqft) ? Math.max(0, args.sqft) : 0
  const multiplier =
    catalog.conditionMultipliers[args.condition] *
    catalog.storyMultipliers[args.stories] *
    (service.frequencyEligible ? catalog.frequencyMultipliers[args.frequency] : 1)

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
