import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'

import config from '@/payload.config'
import { loadBillingWorkspace } from '@/lib/billing/workspace'
import type { User } from '@/payload-types'

const testRunKey = `billing-workspace-${Date.now()}`
const created: Array<{ collection: string; id: number | string }> = []

let payload: Payload
let adminUser: User
let billingAccountId: number | string
let customerUser: User

async function createRecord<T>({
  collection,
  data,
}: {
  collection: 'accounts' | 'invoices' | 'service-appointments' | 'service-plans' | 'users'
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

describe('loadBillingWorkspace', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    adminUser = await createRecord<User>({
      collection: 'users',
      data: {
        email: `${testRunKey}.admin@example.com`,
        name: `${testRunKey} admin`,
        password: 'test-password',
        roles: ['admin'],
      },
    })

    customerUser = await createRecord<User>({
      collection: 'users',
      data: {
        billingDiscountNote: 'VIP customer retention',
        billingDiscountType: 'flat_amount',
        billingDiscountValue: 25,
        email: `${testRunKey}.customer@example.com`,
        name: `${testRunKey} customer`,
        password: 'test-password',
        roles: ['customer'],
      },
    })

    const account = await createRecord<{ id: number }>({
      collection: 'accounts',
      data: {
        accountType: 'commercial',
        billingEmail: `${testRunKey}.billing@example.com`,
        billingMode: 'send_invoice_terms',
        billingRollupMode: 'monthly_consolidated',
        billingTermsDays: 30,
        customerUser: customerUser.id,
        defaultDiscountNote: 'Commercial house discount',
        defaultDiscountType: 'percent',
        defaultDiscountValue: 10,
        name: `${testRunKey} account`,
        portalAccessMode: 'app_and_stripe',
        status: 'active',
      },
    })
    billingAccountId = account.id

    await createRecord({
      collection: 'invoices',
      data: {
        account: account.id,
        balanceDue: 640,
        customerEmail: `${testRunKey}.billing@example.com`,
        customerName: `${testRunKey} account`,
        customerUser: customerUser.id,
        deliveryStatus: 'sent',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        invoiceNumber: `${Date.now()}-overdue`,
        issueDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        lineItems: [
          {
            amount: 640,
            description: 'Monthly consolidated route',
          },
        ],
        paymentCollectionMethod: 'send_invoice',
        status: 'overdue',
        title: `${testRunKey} overdue invoice`,
        total: 640,
      },
    })

    await createRecord({
      collection: 'invoices',
      data: {
        account: account.id,
        balanceDue: 420,
        customerEmail: `${testRunKey}.billing@example.com`,
        customerName: `${testRunKey} account`,
        customerUser: customerUser.id,
        deliveryStatus: 'draft',
        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        invoiceNumber: `${Date.now()}-draft`,
        issueDate: new Date().toISOString(),
        lineItems: [
          {
            amount: 420,
            description: 'Still needs send',
          },
        ],
        paymentCollectionMethod: 'send_invoice',
        status: 'open',
        title: `${testRunKey} open invoice`,
        total: 420,
      },
    })

    await createRecord({
      collection: 'service-plans',
      data: {
        account: account.id,
        anchorDate: new Date().toISOString(),
        billingMode: 'subscription_send_invoice',
        customerEmail: `${testRunKey}.billing@example.com`,
        customerName: `${testRunKey} account`,
        customerUser: customerUser.id,
        serviceSummary: 'Recurring storefront wash',
        singleJobAmount: 300,
        status: 'active',
        title: `${testRunKey} plan`,
        visitsPerYear: 4,
      },
    })

    await createRecord({
      collection: 'service-appointments',
      data: {
        account: account.id,
        billableAmount: 275,
        billableStatus: 'ready_to_bill',
        customerEmail: `${testRunKey}.billing@example.com`,
        customerName: `${testRunKey} account`,
        customerUser: customerUser.id,
        requestSource: 'phone',
        serviceAddress: {
          city: 'Austin',
          postalCode: '78701',
          state: 'TX',
          street1: '100 Demo Commerce Way',
        },
        status: 'completed',
        title: `${testRunKey} appointment`,
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

  it('builds invoice, subscription, and monthly rollup summaries for ops billing follow-up', async () => {
    const workspace = await loadBillingWorkspace({
      demoAccountIds: [Number(billingAccountId)],
      payload,
      user: adminUser,
    })

    expect(workspace.invoices).toHaveLength(2)
    expect(workspace.invoices.some((invoice) => invoice.title === `${testRunKey} overdue invoice`)).toBe(true)
    expect(workspace.metrics.find((metric) => metric.label === 'Open invoices')?.value).toBe('2')
    expect(workspace.metrics.find((metric) => metric.label === 'Overdue')?.value).toBe('1')
    expect(workspace.metrics.find((metric) => metric.label === 'Needs send')?.value).toBe('1')
    expect(workspace.invoices[0]?.activeDiscountSource).toBe('user')
    expect(workspace.invoices[0]?.activeDiscountAmount).toBe(25)
    expect(workspace.servicePlans.some((plan) => plan.title === `${testRunKey} plan`)).toBe(true)
    expect(workspace.monthlyCandidates[0]).toMatchObject({
      accountName: `${testRunKey} account`,
      billingTermsDays: 30,
      readyCount: 1,
    })
  })
})
