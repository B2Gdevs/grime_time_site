import { beforeEach, describe, expect, it, vi } from 'vitest'

const customersCreate = vi.fn()
const getStripeOrThrow = vi.fn(() => ({
  customers: {
    create: customersCreate,
  },
}))

vi.mock('@/lib/billing/stripe/client', () => ({
  getStripeOrThrow,
}))

describe('ensureStripeCustomer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    customersCreate.mockResolvedValue({
      id: 'cus_new_123',
      invoice_settings: {
        default_payment_method: 'pm_123',
      },
    })
  })

  it('reuses the account stripe customer id when already present', async () => {
    const payload = {
      find: vi.fn(),
      update: vi.fn(),
    }

    const { ensureStripeCustomer } = await import('@/lib/billing/stripe/customers')
    const result = await ensureStripeCustomer({
      account: {
        id: 42,
        stripeCustomerID: 'cus_existing_123',
      } as never,
      payload: payload as never,
    })

    expect(result).toBe('cus_existing_123')
    expect(payload.find).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
    expect(customersCreate).not.toHaveBeenCalled()
  })

  it('backfills the account from linked billing documents before creating a new Stripe customer', async () => {
    const payload = {
      find: vi
        .fn()
        .mockResolvedValueOnce({
          docs: [{ stripeCustomerID: 'cus_invoice_123' }],
        }),
      update: vi.fn().mockResolvedValue({}),
    }

    const { ensureStripeCustomer } = await import('@/lib/billing/stripe/customers')
    const result = await ensureStripeCustomer({
      account: {
        id: 42,
        stripeCustomerID: null,
      } as never,
      payload: payload as never,
    })

    expect(result).toBe('cus_invoice_123')
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'accounts',
      data: {
        stripeCustomerID: 'cus_invoice_123',
      },
      id: 42,
    })
    expect(customersCreate).not.toHaveBeenCalled()
  })

  it('creates and stores a Stripe customer when no linked id exists yet', async () => {
    const payload = {
      find: vi
        .fn()
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] }),
      update: vi.fn().mockResolvedValue({}),
    }

    const { ensureStripeCustomer } = await import('@/lib/billing/stripe/customers')
    const result = await ensureStripeCustomer({
      account: {
        accountType: 'residential',
        billingEmail: 'customer@example.com',
        id: 42,
        legalName: 'Customer Account',
        name: 'Customer Account',
        serviceAddress: null,
        stripeCustomerID: null,
      } as never,
      payload: payload as never,
      user: {
        email: 'customer@example.com',
        name: 'Customer Name',
        phone: '555-0100',
      } as never,
    })

    expect(result).toBe('cus_new_123')
    expect(customersCreate).toHaveBeenCalled()
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'accounts',
      data: {
        stripeCustomerID: 'cus_new_123',
        stripeDefaultPaymentMethodID: 'pm_123',
      },
      id: 42,
    })
  })
})
