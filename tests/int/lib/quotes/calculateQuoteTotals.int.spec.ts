import { describe, expect, it } from 'vitest'

import { calculateQuoteTotals } from '@/lib/quotes/calculateQuoteTotals'
import {
  applyQuoteServiceLineDefaults,
  buildQuoteTitle,
} from '@/lib/quotes/normalizeQuoteDraft'

describe('calculateQuoteTotals', () => {
  it('calculates subtotal, taxable subtotal, and tax for normal taxable lines', () => {
    const totals = calculateQuoteTotals({
      discountAmount: 25,
      serviceLines: [
        { quantity: 1, taxable: true, unitPrice: 200 },
        { quantity: 2, taxable: true, unitPrice: 50 },
        { quantity: 1, taxable: false, unitPrice: 40 },
      ],
      taxDecision: 'collect_sales_tax',
      taxRatePercent: 8.25,
    })

    expect(totals).toEqual({
      salesTaxAmount: 22.69,
      subtotal: 315,
      taxableSubtotal: 275,
      total: 337.69,
    })
  })

  it('zeros out taxable subtotal for explicit exemption paths', () => {
    const totals = calculateQuoteTotals({
      discountAmount: 0,
      serviceLines: [{ quantity: 1, taxable: true, unitPrice: 300 }],
      taxDecision: 'homebuilder_exception',
      taxRatePercent: 8.25,
    })

    expect(totals).toEqual({
      salesTaxAmount: 0,
      subtotal: 300,
      taxableSubtotal: 0,
      total: 300,
    })
  })
})

describe('quote draft helpers', () => {
  it('applies sane defaults for common service lines', () => {
    expect(applyQuoteServiceLineDefaults({ serviceType: 'window_cleaning' })).toEqual({
      description: 'Exterior window cleaning',
      serviceType: 'window_cleaning',
      taxCategory: 'window_washing',
      taxable: true,
      unit: 'job',
    })
  })

  it('builds a fallback title from customer, location, and first service line', () => {
    const title = buildQuoteTitle({
      customerName: 'Acme HOA',
      serviceAddress: { city: 'Fort Worth' },
      serviceLines: [{ description: 'Concrete / flatwork cleaning' }],
    })

    expect(title).toBe('Acme HOA - Fort Worth - Concrete / flatwork cleaning')
  })
})
