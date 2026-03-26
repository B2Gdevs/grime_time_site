import { getPayload } from 'payload'

import config from '../../src/payload.config.js'

const runKey = `e2e-portal-${Date.now()}`
const created: Array<{ collection: string; id: number | string }> = []

export const portalCompanyFixture = {
  customerEmail: `${runKey}.customer@example.com`,
  customerName: `${runKey} customer`,
  invoiceTitle: `${runKey} monthly exterior service`,
}

async function createRecord<T>({
  collection,
  data,
}: {
  collection: 'accounts' | 'invoices' | 'users'
  data: Record<string, unknown>
}): Promise<T & { id: number | string }> {
  const payload = await getPayload({ config })
  const doc = (await payload.create({
    collection,
    data,
    overrideAccess: true,
  } as never)) as unknown as T & { id: number | string }

  created.push({ collection, id: doc.id })
  return doc
}

export async function seedPortalCompany(): Promise<void> {
  const customer = await createRecord<{ id: number }>({
    collection: 'users',
    data: {
      account: null,
      email: portalCompanyFixture.customerEmail,
      name: portalCompanyFixture.customerName,
      password: 'test',
      roles: ['customer'],
    },
  })

  const account = await createRecord<{ id: number }>({
    collection: 'accounts',
    data: {
      accountType: 'commercial',
      billingEmail: portalCompanyFixture.customerEmail,
      customerUser: customer.id,
      name: `${runKey} account`,
      status: 'active',
    },
  })

  const payload = await getPayload({ config })
  await payload.update({
    collection: 'users',
    id: customer.id,
    data: {
      account: account.id,
      company: `${runKey} company`,
    },
    overrideAccess: true,
  })

  await createRecord({
    collection: 'invoices',
    data: {
      account: account.id,
      balanceDue: 250,
      customerEmail: portalCompanyFixture.customerEmail,
      customerName: portalCompanyFixture.customerName,
      customerUser: customer.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      invoiceNumber: `${Date.now()}`,
      issueDate: new Date().toISOString(),
      lineItems: [
        {
          amount: 250,
          description: 'Monthly route service',
        },
      ],
      status: 'open',
      title: portalCompanyFixture.invoiceTitle,
      total: 250,
    },
  })
}

export async function cleanupPortalCompany(): Promise<void> {
  const payload = await getPayload({ config })

  for (const entry of created.reverse()) {
    await payload.delete({
      collection: entry.collection as never,
      id: entry.id,
      overrideAccess: true,
    })
  }
}
