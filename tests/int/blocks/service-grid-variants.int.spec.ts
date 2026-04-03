import { describe, expect, it } from 'vitest'

import { resolveServiceGridDisplayVariant } from '@/blocks/ServiceGrid/variants'

describe('service grid display variants', () => {
  it('uses explicit variants when present', () => {
    expect(
      resolveServiceGridDisplayVariant({
        displayVariant: 'pricingSteps',
        heading: 'What we do',
      }),
    ).toBe('pricingSteps')
  })

  it('falls back to heading-based defaults for existing homepage content', () => {
    expect(resolveServiceGridDisplayVariant({ heading: 'What we do' })).toBe('featureCards')
    expect(resolveServiceGridDisplayVariant({ heading: 'How our pricing works' })).toBe('pricingSteps')
  })

  it('defaults unknown sections to the interactive renderer', () => {
    expect(resolveServiceGridDisplayVariant({ heading: 'Seasonal proof' })).toBe('interactive')
    expect(resolveServiceGridDisplayVariant(undefined)).toBe('interactive')
  })
})
