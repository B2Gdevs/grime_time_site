import { describe, expect, it } from 'vitest'

import { resolveActiveBillingDiscount } from '@/lib/billing/discountPolicy'

describe('resolveActiveBillingDiscount', () => {
  it('prefers user-level overrides over account defaults', () => {
    const discount = resolveActiveBillingDiscount({
      account: {
        defaultDiscountType: 'percent',
        defaultDiscountValue: 10,
        id: 1,
        name: 'Account',
      } as never,
      total: 200,
      user: {
        billingDiscountType: 'flat_amount',
        billingDiscountValue: 35,
        email: 'customer@example.com',
        id: 2,
        name: 'Customer',
      } as never,
    })

    expect(discount.source).toBe('user')
    expect(discount.amount).toBe(35)
  })

  it('falls back to account defaults when no user override exists', () => {
    const discount = resolveActiveBillingDiscount({
      account: {
        defaultDiscountNote: 'Commercial courtesy adjustment',
        defaultDiscountType: 'percent',
        defaultDiscountValue: 15,
        id: 1,
        name: 'Commercial account',
      } as never,
      total: 400,
    })

    expect(discount.source).toBe('account')
    expect(discount.amount).toBe(60)
    expect(discount.note).toContain('Commercial courtesy')
  })
})

