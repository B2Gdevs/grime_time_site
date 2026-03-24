import { QUOTE_TAX_GUIDANCE } from './constants'

type QuoteServiceLineDraft = {
  description?: null | string
  serviceType?: null | string
  taxCategory?: null | string
  taxable?: boolean | null
  unit?: null | string
}

type QuoteDraft = {
  customerName?: null | string
  pricing?: {
    taxDecision?: null | string
    taxDecisionNotes?: null | string
  } | null
  serviceAddress?: {
    city?: null | string
    street1?: null | string
  } | null
  serviceLines?: null | QuoteServiceLineDraft[]
  title?: null | string
}

const SERVICE_LINE_DEFAULTS: Record<
  string,
  {
    description: string
    taxCategory: string
    taxable: boolean
    unit: string
  }
> = {
  concrete_cleaning: {
    description: 'Concrete / flatwork cleaning',
    taxCategory: 'pressure_washing_maintenance',
    taxable: true,
    unit: 'job',
  },
  deck_patio_cleaning: {
    description: 'Deck / patio cleaning',
    taxCategory: 'pressure_washing_maintenance',
    taxable: true,
    unit: 'job',
  },
  driveway_walkway_cleaning: {
    description: 'Driveway / walkway cleaning',
    taxCategory: 'pressure_washing_maintenance',
    taxable: true,
    unit: 'job',
  },
  fence_cleaning: {
    description: 'Fence cleaning',
    taxCategory: 'pressure_washing_maintenance',
    taxable: true,
    unit: 'job',
  },
  gutter_cleaning: {
    description: 'Gutter cleaning',
    taxCategory: 'building_grounds_cleaning',
    taxable: true,
    unit: 'job',
  },
  house_wash: {
    description: 'House wash',
    taxCategory: 'building_grounds_cleaning',
    taxable: true,
    unit: 'job',
  },
  other: {
    description: 'Custom exterior cleaning service',
    taxCategory: 'manual_review_required',
    taxable: true,
    unit: 'job',
  },
  roof_cleaning: {
    description: 'Roof cleaning',
    taxCategory: 'building_grounds_cleaning',
    taxable: true,
    unit: 'job',
  },
  rust_stain_treatment: {
    description: 'Rust / stain treatment',
    taxCategory: 'pressure_washing_maintenance',
    taxable: true,
    unit: 'job',
  },
  soft_wash: {
    description: 'Soft wash treatment',
    taxCategory: 'building_grounds_cleaning',
    taxable: true,
    unit: 'job',
  },
  window_cleaning: {
    description: 'Exterior window cleaning',
    taxCategory: 'window_washing',
    taxable: true,
    unit: 'job',
  },
}

function cleanText(value: null | string | undefined): string {
  return value?.trim() ?? ''
}

function fallbackLineDefaults(serviceType: null | string | undefined) {
  return SERVICE_LINE_DEFAULTS[serviceType ?? ''] ?? SERVICE_LINE_DEFAULTS.other
}

export function applyQuoteServiceLineDefaults(
  line: QuoteServiceLineDraft,
): QuoteServiceLineDraft {
  const defaults = fallbackLineDefaults(line.serviceType)

  return {
    ...line,
    description: cleanText(line.description) || defaults.description,
    taxCategory: line.taxCategory || defaults.taxCategory,
    taxable: line.taxable ?? defaults.taxable,
    unit: cleanText(line.unit) || defaults.unit,
  }
}

export function buildQuoteTitle(data: QuoteDraft): string {
  const explicitTitle = cleanText(data.title)

  if (explicitTitle) {
    return explicitTitle
  }

  const customerName = cleanText(data.customerName)
  const location =
    cleanText(data.serviceAddress?.street1) || cleanText(data.serviceAddress?.city)
  const primaryService = cleanText(data.serviceLines?.[0]?.description)

  return [customerName, location, primaryService].filter(Boolean).join(' - ') || 'Untitled quote'
}

export function buildQuoteTaxDecisionNotes(data: QuoteDraft): string | undefined {
  const notes = cleanText(data.pricing?.taxDecisionNotes)
  if (notes) {
    return notes
  }

  if (
    data.pricing?.taxDecision === 'homebuilder_exception' ||
    data.pricing?.taxDecision === 'exemption_certificate' ||
    data.pricing?.taxDecision === 'manual_review_required'
  ) {
    return QUOTE_TAX_GUIDANCE
  }

  return undefined
}
