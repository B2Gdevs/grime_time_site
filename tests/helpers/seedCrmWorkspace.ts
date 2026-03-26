import { getPayload } from 'payload'

import config from '../../src/payload.config.js'
import { testUser } from './seedUser'

const crmRunKey = `e2e-crm-${Date.now()}`
const created: Array<{ collection: string; id: number | string }> = []

export const crmWorkspaceFixture = {
  accountName: `${crmRunKey} account`,
  noteBody: `${crmRunKey} note body`,
}

async function createRecord({
  collection,
  data,
}: {
  collection: 'accounts' | 'contacts' | 'crm-tasks' | 'leads' | 'opportunities'
  data: Record<string, unknown>
}) {
  const payload = await getPayload({ config })
  const doc = (await payload.create({
    collection,
    data,
    overrideAccess: true,
  } as never)) as { id: number | string }

  created.push({ collection, id: doc.id })
  return doc
}

export async function seedCrmWorkspace(): Promise<void> {
  const payload = await getPayload({ config })
  const users = await payload.find({
    collection: 'users',
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })

  const admin = users.docs[0]
  if (!admin) {
    throw new Error('Missing seeded admin user for CRM workspace e2e test.')
  }

  const account = await createRecord({
    collection: 'accounts',
    data: {
      accountType: 'commercial',
      accountsPayablePhone: '555-0303',
      billingEmail: `${crmRunKey}.billing@example.com`,
      locationCount: 2,
      name: crmWorkspaceFixture.accountName,
      owner: admin.id,
      serviceLocationSummary: 'Two-site route account',
      status: 'prospect',
    },
  })

  const contact = await createRecord({
    collection: 'contacts',
    data: {
      account: account.id,
      email: `${crmRunKey}.contact@example.com`,
      fullName: `${crmRunKey} contact`,
      owner: admin.id,
      phone: '555-0301',
      status: 'active',
    },
  })

  const lead = await createRecord({
    collection: 'leads',
    data: {
      account: account.id,
      contact: contact.id,
      customerEmail: `${crmRunKey}.lead@example.com`,
      customerName: `${crmRunKey} lead`,
      nextActionAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      owner: admin.id,
      priority: 'high',
      serviceSummary: 'Route walkthrough requested',
      source: 'manual',
      staleAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      status: 'working',
      title: `${crmRunKey} lead`,
    },
  })

  const opportunity = await createRecord({
    collection: 'opportunities',
    data: {
      account: account.id,
      contact: contact.id,
      lead: lead.id,
      nextAction: 'Confirm access window',
      nextActionAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      owner: admin.id,
      priority: 'high',
      stage: 'follow_up',
      status: 'open',
      title: `${crmRunKey} opportunity`,
      value: 1800,
    },
  })

  await createRecord({
    collection: 'crm-tasks',
    data: {
      account: account.id,
      contact: contact.id,
      dueAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      lead: lead.id,
      opportunity: opportunity.id,
      owner: admin.id,
      priority: 'high',
      status: 'open',
      taskType: 'quote_follow_up',
      title: `${crmRunKey} task`,
    },
  })
}

export async function cleanupCrmWorkspace(): Promise<void> {
  const payload = await getPayload({ config })

  for (const entry of created.reverse()) {
    await payload.delete({
      collection: entry.collection as never,
      id: entry.id,
      overrideAccess: true,
    })
  }
}
