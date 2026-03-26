import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'

import config from '@/payload.config'
import { getCustomerPortalData } from '@/lib/customers/getCustomerPortalData'
import type { User } from '@/payload-types'

const testRunKey = `portal-scope-${Date.now()}`
const created: Array<{ collection: string; id: number | string }> = []

let payload: Payload
let memberUser: User

async function createRecord<T>({
  collection,
  data,
}: {
  collection: 'accounts' | 'invoices' | 'quotes' | 'users'
  data: Record<string, unknown>
}): Promise<T & { id: number | string }> {
  const doc = (await payload.create({
    collection,
    data,
    overrideAccess: true,
  } as never)) as unknown as T & { id: number | string }

  created.push({ collection, id: doc.id })
  return doc
}

describe('getCustomerPortalData', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    const primaryUser = await createRecord<User>({
      collection: 'users',
      data: {
        email: `${testRunKey}.primary@example.com`,
        password: 'test-password',
        roles: ['customer'],
      },
    })

    memberUser = await createRecord<User>({
      collection: 'users',
      data: {
        email: `${testRunKey}.member@example.com`,
        name: `${testRunKey} member`,
        password: 'test-password',
        roles: ['customer'],
      },
    })

    const account = await createRecord<{ id: number }>({
      collection: 'accounts',
      data: {
        accountType: 'commercial',
        billingEmail: `${testRunKey}.billing@example.com`,
        customerUser: primaryUser.id,
        name: `${testRunKey} account`,
        status: 'active',
      },
    })

    await payload.update({
      collection: 'users',
      id: memberUser.id,
      data: {
        account: account.id,
        company: `${testRunKey} company`,
      },
      overrideAccess: true,
    })

    memberUser = (await payload.findByID({
      collection: 'users',
      depth: 0,
      id: memberUser.id,
      overrideAccess: true,
    })) as User

    await createRecord({
      collection: 'invoices',
      data: {
        account: account.id,
        balanceDue: 480,
        customerEmail: `${testRunKey}.billing@example.com`,
        customerName: `${testRunKey} company`,
        customerUser: primaryUser.id,
        invoiceNumber: `${Date.now()}-portal-scope`,
        lineItems: [
          {
            amount: 480,
            description: 'Commercial wash',
          },
        ],
        status: 'open',
        title: `${testRunKey} invoice`,
        total: 480,
      },
    })

    await createRecord({
      collection: 'quotes',
      data: {
        account: account.id,
        customerEmail: `${testRunKey}.billing@example.com`,
        customerName: `${testRunKey} company`,
        customerUser: primaryUser.id,
        pricing: {
          discountAmount: 0,
          salesTaxAmount: 0,
          subtotal: 900,
          taxableSubtotal: 900,
          taxDecision: 'collect_sales_tax',
          taxDecisionNotes: 'Test note',
          taxRatePercent: 8.25,
          total: 900,
        },
        serviceAddress: {
          city: 'Austin',
          postalCode: '78701',
          state: 'TX',
          street1: '100 Congress Ave',
        },
        serviceLines: [
          {
            description: 'Commercial wash',
            lineTotal: 900,
            quantity: 1,
            serviceType: 'house_wash',
            taxCategory: 'building_grounds_cleaning',
            taxable: true,
            unit: 'job',
            unitPrice: 900,
          },
        ],
        status: 'sent',
        title: `${testRunKey} quote`,
      },
    })
  }, 30000)

  afterAll(async () => {
    for (const entry of created.reverse()) {
      await payload.delete({
        collection: entry.collection as never,
        id: entry.id,
        overrideAccess: true,
      })
    }
  }, 30000)

  it('includes company-linked records for member users through the account relationship', async () => {
    const snapshot = await getCustomerPortalData(memberUser)

    expect(snapshot.invoices.some((invoice) => invoice.title === `${testRunKey} invoice`)).toBe(true)
    expect(snapshot.estimates.some((estimate) => estimate.title === `${testRunKey} quote`)).toBe(true)
  })
})
