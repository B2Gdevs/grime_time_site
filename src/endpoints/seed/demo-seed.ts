import type { Payload, PayloadRequest } from 'payload'
import type { Invoice } from '@/payload-types'

import { calculateLineTotal, calculateQuoteTotals } from '@/lib/quotes/calculateQuoteTotals'
import { resolveSeedStaffEmails } from '@/utilities/quotesAccess'

import {
  DEMO_CUSTOMER_PASSWORD,
  DEMO_NOTIFICATION_EMAIL,
  demoAccounts,
  demoPersonas,
} from './demo-personas'

type Id = number

function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

export async function seedDemoData({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> {
  payload.logger.info('— Demo seed (DEMO_SEED): upserting personas, CRM, and billing fixtures...')

  const staffEmails = resolveSeedStaffEmails()
  const staffUsers: { id: Id; email: string }[] = []
  for (const email of staffEmails) {
    const found = await payload.find({
      collection: 'users',
      depth: 0,
      limit: 1,
      pagination: false,
      req,
      where: { email: { equals: email } },
    })
    const doc = found.docs[0]
    if (doc) staffUsers.push({ id: doc.id, email })
  }
  if (staffUsers.length === 0) {
    payload.logger.warn('Demo seed: no staff users from QUOTES_INTERNAL_EMAILS — owners will be unset.')
  }
  const pickOwner = (i: number) => staffUsers[i % staffUsers.length]?.id

  const accountByKey: Record<string, { id: Id; name: string }> = {}

  for (let i = 0; i < demoAccounts.length; i++) {
    const a = demoAccounts[i]
    const existing = await payload.find({
      collection: 'accounts',
      depth: 0,
      limit: 1,
      pagination: false,
      req,
      where: { name: { equals: a.name } },
    })
    const owner = pickOwner(i)
    const data = {
      accountType: a.accountType,
      billingEmail: DEMO_NOTIFICATION_EMAIL,
      billingMode:
        a.accountType === 'commercial'
          ? ('send_invoice_terms' as const)
          : ('send_invoice_due_on_receipt' as const),
      billingRollupMode:
        a.accountType === 'commercial'
          ? ('monthly_consolidated' as const)
          : ('per_service' as const),
      billingTermsDays: a.accountType === 'commercial' ? 30 : 0,
      defaultDiscountNote: a.accountType === 'commercial' ? 'Preferred commercial account' : undefined,
      defaultDiscountType: a.accountType === 'commercial' ? ('percent' as const) : ('none' as const),
      defaultDiscountValue: a.accountType === 'commercial' ? 8 : 0,
      name: a.name,
      owner: owner ?? undefined,
      portalAccessMode: 'app_and_stripe' as const,
      serviceAddress: {
        city: 'Austin',
        postalCode: '78701',
        state: 'TX',
        street1: `${128 + i} Demo Lane`,
      },
      status: 'active' as const,
    }
    if (existing.docs[0]) {
      const updated = await payload.update({
        id: existing.docs[0].id,
        collection: 'accounts',
        data,
        req,
      }) as { id: Id }
      accountByKey[a.key] = { id: updated.id, name: a.name }
    } else {
      const created = await payload.create({
        collection: 'accounts',
        data,
        req,
      })
      accountByKey[a.key] = { id: created.id, name: a.name }
    }
  }

  const userByEmail: Record<string, { id: Id; name: string; accountKey: string }> = {}

  for (let i = 0; i < demoPersonas.length; i++) {
    const p = demoPersonas[i]
    const acc = accountByKey[p.accountKey]
    if (!acc) continue

    const existing = await payload.find({
      collection: 'users',
      depth: 0,
      limit: 1,
      pagination: false,
      req,
      where: { email: { equals: p.email } },
    })

    const userData = {
      account: acc.id,
      billingDiscountNote: p.key === 'jamie.patel' ? 'AP escalation courtesy credit buffer' : undefined,
      billingDiscountType: p.key === 'jamie.patel' ? ('flat_amount' as const) : ('none' as const),
      billingDiscountValue: p.key === 'jamie.patel' ? 35 : 0,
      email: p.email,
      name: p.name,
      password: DEMO_CUSTOMER_PASSWORD,
      phone: `(512) 555-${String(1000 + i).slice(-4)}`,
      roles: ['customer'] as Array<'customer'>,
      serviceAddress: {
        city: 'Austin',
        postalCode: '78701',
        state: 'TX',
        street1: `${200 + i} Demo Street`,
      },
    }

    if (existing.docs[0]) {
      const updated = await payload.update({
        id: existing.docs[0].id,
        collection: 'users',
        data: {
          account: acc.id,
          name: p.name,
          phone: userData.phone,
          roles: ['customer'],
          serviceAddress: userData.serviceAddress,
        },
        req,
      })
      userByEmail[p.email] = { accountKey: p.accountKey, id: updated.id, name: p.name }
    } else {
      const created = await payload.create({
        collection: 'users',
        data: userData,
        req,
      })
      userByEmail[p.email] = { accountKey: p.accountKey, id: created.id, name: p.name }
    }
  }

  const contactByEmail: Record<string, Id> = {}
  for (const p of demoPersonas) {
    const acc = accountByKey[p.accountKey]
    const u = userByEmail[p.email]
    if (!acc || !u) continue

    const found = await payload.find({
      collection: 'contacts',
      depth: 0,
      limit: 1,
      pagination: false,
      req,
      where: { email: { equals: p.email } },
    })
    const owner = pickOwner(3)
    const cdata = {
      account: acc.id,
      email: p.email,
      fullName: p.name,
      linkedUser: u.id,
      owner: owner ?? undefined,
      preferredContactMethod: 'email' as const,
      roles: ['primary' as const],
      status: 'active' as const,
    }
    if (found.docs[0]) {
      const udoc = await payload.update({
        id: found.docs[0].id,
        collection: 'contacts',
        data: cdata,
        req,
      })
      contactByEmail[p.email] = udoc.id
    } else {
      const created = await payload.create({
        collection: 'contacts',
        data: cdata,
        req,
      })
      contactByEmail[p.email] = created.id
    }
  }

  for (const a of demoAccounts) {
    const acc = accountByKey[a.key]
    if (!acc) continue
    const firstPersona = demoPersonas.find((p) => p.accountKey === a.key)
    if (!firstPersona) continue
    const primaryUser = userByEmail[firstPersona.email]
    const primaryContact = contactByEmail[firstPersona.email]
    if (!primaryUser || !primaryContact) continue

    await payload.update({
      id: acc.id,
      collection: 'accounts',
      data: {
        customerUser: primaryUser.id,
        primaryContact,
      },
      req,
    })
  }

  const jordan = userByEmail['jordan.chen@demo.grimetime.local']
  const chen = accountByKey['demo-chen-household']
  const hoa = accountByKey['demo-sunset-ridge-hoa']
  const retail = accountByKey['demo-lakeside-retail']

  if (jordan && chen) {
    const leadTitle = 'Instant quote — Oak Hollow Dr (demo)'
    const lExisting = await payload.find({
      collection: 'leads',
      depth: 0,
      limit: 1,
      pagination: false,
      req,
      where: { title: { equals: leadTitle } },
    })
    const ldata = {
      account: chen.id,
      customerEmail: DEMO_NOTIFICATION_EMAIL,
      customerName: 'Jordan Chen',
      customerPhone: '(512) 555-0101',
      nextActionAt: daysFromNow(1),
      owner: pickOwner(0),
      priority: 'high' as const,
      serviceAddress: {
        city: 'Austin',
        postalCode: '78702',
        state: 'TX',
        street1: '220 Demo Street',
      },
      serviceSummary: 'Instant quote submission — soft wash + driveway rinse (seed).',
      source: 'instant_quote' as const,
      status: 'new' as const,
      temperature: 'hot' as const,
      title: leadTitle,
    }
    if (!lExisting.docs[0]) {
      await payload.create({ collection: 'leads', data: ldata, req })
    } else {
      await payload.update({ id: lExisting.docs[0].id, collection: 'leads', data: ldata, req })
    }
  }

  const supportTitle = 'Contact — gutter leak follow-up (demo)'
  const sExisting = await payload.find({
    collection: 'leads',
    depth: 0,
    limit: 1,
    pagination: false,
    req,
    where: { title: { equals: supportTitle } },
  })
  const sdata = {
    account: retail?.id,
    customerEmail: DEMO_NOTIFICATION_EMAIL,
    customerName: 'Lakeside Retail — facilities',
    customerPhone: '(512) 555-0199',
    nextActionAt: daysFromNow(2),
    owner: pickOwner(1),
    priority: 'medium' as const,
    serviceSummary: 'Support thread: water stain after last service (seed).',
    source: 'contact_request' as const,
    status: 'working' as const,
    temperature: 'warm' as const,
    title: supportTitle,
  }
  if (!sExisting.docs[0]) {
    await payload.create({ collection: 'leads', data: sdata, req })
  } else {
    await payload.update({ id: sExisting.docs[0].id, collection: 'leads', data: sdata, req })
  }

  const baseLine = {
    description: 'Exterior soft wash (seed)',
    quantity: 1,
    serviceType: 'soft_wash' as const,
    taxCategory: 'building_grounds_cleaning' as const,
    taxable: true,
    unit: 'job',
    unitPrice: 420,
  }
  const line = { ...baseLine, lineTotal: calculateLineTotal(baseLine) }
  const totals = calculateQuoteTotals({
    discountAmount: 0,
    serviceLines: [line],
    taxDecision: 'collect_sales_tax',
    taxRatePercent: 8.25,
  })

  const quoteTitle = 'Chen residence — maintenance quote (demo)'
  const qExisting = await payload.find({
    collection: 'quotes',
    depth: 0,
    limit: 1,
    pagination: false,
    req,
    where: { title: { equals: quoteTitle } },
  })
  if (jordan && chen && !qExisting.docs[0]) {
    await payload.create({
      collection: 'quotes',
      data: {
        account: chen.id,
        customerEmail: DEMO_NOTIFICATION_EMAIL,
        customerName: 'Jordan Chen',
        customerPhone: '(512) 555-0101',
        customerUser: jordan.id,
        pricing: {
          ...totals,
          taxRatePercent: 8.25,
        },
        propertyType: 'residential',
        serviceAddress: {
          city: 'Austin',
          postalCode: '78702',
          state: 'TX',
          street1: '220 Demo Street',
        },
        serviceLines: [line],
        status: 'sent',
        title: quoteTitle,
        validUntil: daysFromNow(21),
      },
      req,
    })
  }

  type StageRow = {
    accountKey: string
    contactEmail: string
    stage:
      | 'new_lead'
      | 'qualified'
      | 'quoted'
      | 'follow_up'
      | 'scheduling'
      | 'won'
      | 'lost'
    status: 'open' | 'won' | 'lost'
    title: string
    value: number
  }

  const stageRows: StageRow[] = [
    {
      accountKey: 'demo-chen-household',
      contactEmail: 'jordan.chen@demo.grimetime.local',
      stage: 'new_lead',
      status: 'open',
      title: 'Chen — new lead intake (demo)',
      value: 1200,
    },
    {
      accountKey: 'demo-sunset-ridge-hoa',
      contactEmail: 'morgan.park@demo.grimetime.local',
      stage: 'qualified',
      status: 'open',
      title: 'Sunset Ridge — perimeter wash (demo)',
      value: 8400,
    },
    {
      accountKey: 'demo-lakeside-retail',
      contactEmail: 'casey.nguyen@demo.grimetime.local',
      stage: 'quoted',
      status: 'open',
      title: 'Lakeside — storefront refresh (demo)',
      value: 5600,
    },
    {
      accountKey: 'demo-lakeside-retail',
      contactEmail: 'drew.okonkwo@demo.grimetime.local',
      stage: 'follow_up',
      status: 'open',
      title: 'Lakeside — dock bay cleaning (demo)',
      value: 2100,
    },
    {
      accountKey: 'demo-sunset-ridge-hoa',
      contactEmail: 'riley.torres@demo.grimetime.local',
      stage: 'scheduling',
      status: 'open',
      title: 'Sunset Ridge — clubhouse schedule (demo)',
      value: 3200,
    },
    {
      accountKey: 'demo-chen-household',
      contactEmail: 'sam.chen@demo.grimetime.local',
      stage: 'won',
      status: 'won',
      title: 'Chen — patio detail (won) (demo)',
      value: 980,
    },
    {
      accountKey: 'demo-lakeside-retail',
      contactEmail: 'jamie.patel@demo.grimetime.local',
      stage: 'lost',
      status: 'lost',
      title: 'Lakeside — competitor bid (lost) (demo)',
      value: 4500,
    },
  ]

  for (let si = 0; si < stageRows.length; si++) {
    const row = stageRows[si]
    const acc = accountByKey[row.accountKey]
    const contactId = contactByEmail[row.contactEmail]
    if (!acc || !contactId) continue

    const found = await payload.find({
      collection: 'opportunities',
      depth: 0,
      limit: 1,
      pagination: false,
      req,
      where: { title: { equals: row.title } },
    })
    const odata = {
      account: acc.id,
      contact: contactId,
      expectedCloseDate: daysFromNow(14),
      lastActivityAt: new Date().toISOString(),
      nextAction: 'Follow up (demo)',
      nextActionAt: daysFromNow(3),
      owner: pickOwner(si),
      priority: 'medium' as const,
      stage: row.stage,
      status: row.status,
      title: row.title,
      value: row.value,
    }
    if (!found.docs[0]) {
      await payload.create({ collection: 'opportunities', data: odata, req })
    } else {
      await payload.update({ id: found.docs[0].id, collection: 'opportunities', data: odata, req })
    }
  }

  if (jordan && chen) {
    const planTitle = 'Chen household — bi-annual exterior (demo)'
    const pExisting = await payload.find({
      collection: 'service-plans',
      depth: 0,
      limit: 1,
      pagination: false,
      req,
      where: { title: { equals: planTitle } },
    })
    const pdata = {
      account: chen.id,
      anchorDate: daysFromNow(-60),
      billingInstallmentsPerYear: 12,
      billingMode: 'subscription_send_invoice' as const,
      customerEmail: DEMO_NOTIFICATION_EMAIL,
      customerName: 'Jordan Chen',
      customerUser: jordan.id,
      discountPercent: 20,
      serviceAddress: {
        city: 'Austin',
        postalCode: '78702',
        state: 'TX',
        street1: '220 Demo Street',
      },
      serviceSummary: 'Two visits per year — soft wash + rinse (seed).',
      singleJobAmount: 349,
      status: 'active' as const,
      title: planTitle,
      visitsPerYear: 2,
    }
    if (!pExisting.docs[0]) {
      await payload.create({ collection: 'service-plans', data: pdata, req })
    } else {
      await payload.update({ id: pExisting.docs[0].id, collection: 'service-plans', data: pdata, req })
    }
  }

  if (jordan && chen) {
    const appts = [
      {
        arrivalWindow: 'morning' as const,
        customerName: 'Jordan Chen',
        scheduledStart: daysFromNow(-10),
        status: 'completed' as const,
        title: 'Completed — house wash (demo)',
      },
      {
        arrivalWindow: 'afternoon' as const,
        customerName: 'Jordan Chen',
        scheduledStart: daysFromNow(5),
        status: 'confirmed' as const,
        title: 'Scheduled — maintenance visit (demo)',
      },
    ]
    for (const ap of appts) {
      const aExisting = await payload.find({
        collection: 'service-appointments',
        depth: 0,
        limit: 1,
        pagination: false,
        req,
        where: { title: { equals: ap.title } },
      })
      const adata = {
        account: chen.id,
        arrivalWindow: ap.arrivalWindow,
        billableStatus: 'billed' as const,
        completedAt: ap.status === 'completed' ? ap.scheduledStart : undefined,
        customerEmail: DEMO_NOTIFICATION_EMAIL,
        customerName: ap.customerName,
        customerUser: jordan.id,
        requestSource: 'portal' as const,
        scheduledEnd: ap.scheduledStart,
        scheduledStart: ap.scheduledStart,
        serviceAddress: {
          city: 'Austin',
          postalCode: '78702',
          state: 'TX',
          street1: '220 Demo Street',
        },
        status: ap.status,
        title: ap.title,
      }
      if (!aExisting.docs[0]) {
        await payload.create({ collection: 'service-appointments', data: adata, req })
      } else {
        await payload.update({
          id: aExisting.docs[0].id,
          collection: 'service-appointments',
          data: adata,
          req,
        })
      }
    }
  }

  if (hoa) {
    const aExisting = await payload.find({
      collection: 'service-appointments',
      depth: 0,
      limit: 1,
      pagination: false,
      req,
      where: { title: { equals: 'HOA — common area rinse (demo)' } },
    })
    const morgan = userByEmail['morgan.park@demo.grimetime.local']
    if (morgan) {
      const adata = {
        account: hoa.id,
        arrivalWindow: 'flexible' as const,
        customerEmail: DEMO_NOTIFICATION_EMAIL,
        customerName: 'Morgan Park',
        customerUser: morgan.id,
        requestSource: 'phone' as const,
        scheduledStart: daysFromNow(9),
        serviceAddress: {
          city: 'Austin',
          postalCode: '78731',
          state: 'TX',
          street1: '1 HOA Commons Way',
        },
        status: 'confirmed' as const,
        title: 'HOA — common area rinse (demo)',
      }
      if (!aExisting.docs[0]) {
        await payload.create({ collection: 'service-appointments', data: adata, req })
      } else {
        await payload.update({
          id: aExisting.docs[0].id,
          collection: 'service-appointments',
          data: adata,
          req,
        })
      }
    }
  }

  const invoicesSeed: {
    balanceDue: number
    customerName: string
    customerUser: Id
    email: string
    invoiceNumber: string
    status: 'paid' | 'open' | 'refunded'
    title: string
    total: number
  }[] = []

  if (jordan && chen) {
    invoicesSeed.push(
      {
        balanceDue: 0,
        customerName: 'Jordan Chen',
        customerUser: jordan.id,
        email: 'jordan.chen@demo.grimetime.local',
        invoiceNumber: 'DEMO-INV-0001',
        status: 'paid',
        title: 'Chen — spring wash (demo)',
        total: 349,
      },
      {
        balanceDue: 129,
        customerName: 'Jordan Chen',
        customerUser: jordan.id,
        email: 'jordan.chen@demo.grimetime.local',
        invoiceNumber: 'DEMO-INV-REFUND',
        status: 'refunded',
        title: 'Chen — dispute credit (demo)',
        total: 129,
      },
    )
  }

  const jamie = userByEmail['jamie.patel@demo.grimetime.local']
  if (retail && jamie) {
    invoicesSeed.push({
      balanceDue: 420,
      customerName: 'Jamie Patel',
      customerUser: jamie.id,
      email: 'jamie.patel@demo.grimetime.local',
      invoiceNumber: 'DEMO-INV-0002',
      status: 'open',
      title: 'Lakeside — invoice open (demo)',
      total: 420,
    })
  }

  for (const inv of invoicesSeed) {
    const persona = demoPersonas.find((p) => p.email === inv.email)
    const acc = persona ? accountByKey[persona.accountKey]?.id : undefined
    const found = await payload.find({
      collection: 'invoices',
      depth: 0,
      limit: 1,
      pagination: false,
      req,
      where: { invoiceNumber: { equals: inv.invoiceNumber } },
    })
    const refundedAmount = inv.status === 'refunded' ? inv.total : 0
    const balanceDue = inv.status === 'paid' ? 0 : inv.status === 'refunded' ? 0 : inv.balanceDue
    const idata: Partial<Invoice> = {
      account: acc,
      balanceDue,
      customerEmail: DEMO_NOTIFICATION_EMAIL,
      customerName: inv.customerName,
      customerUser: inv.customerUser,
      deliveryStatus: inv.status === 'paid' ? 'sent' : 'sent',
      dueDate: daysFromNow(inv.status === 'open' ? 7 : -3),
      invoiceNumber: inv.invoiceNumber,
      issueDate: daysFromNow(-5),
      lineItems: [
        {
          amount: inv.total,
          description: inv.title,
        },
      ],
      paymentCollectionMethod: 'send_invoice',
      paymentSource: inv.status === 'paid' ? 'stripe' : undefined,
      paidAt: inv.status === 'paid' ? daysFromNow(-2) : undefined,
      refundedAmount,
      status: inv.status,
      title: inv.title,
      total: inv.total,
    }
    if (!found.docs[0]) {
      await payload.create({ collection: 'invoices', data: idata as never, req })
    } else {
      await payload.update({ id: found.docs[0].id, collection: 'invoices', data: idata, req })
    }
  }

  let stripeSyncCount = 0
  try {
    const { getStripeOrThrow } = await import('@/lib/billing/stripe/client')
    const { ensureStripeCustomer } = await import('@/lib/billing/stripe/customers')
    const { syncInvoiceToStripe } = await import('@/lib/billing/stripe/invoices')
    getStripeOrThrow()

    for (const a of demoAccounts) {
      const acc = accountByKey[a.key]
      if (!acc) continue
      const full = await payload.findByID({
        collection: 'accounts',
        id: acc.id,
        depth: 1,
        req,
      })
      const primaryEmail = demoPersonas.find((p) => p.accountKey === a.key)?.email
      const portalUser = primaryEmail ? userByEmail[primaryEmail] : undefined
      if (!portalUser) continue
      const udoc = await payload.findByID({
        collection: 'users',
        id: portalUser.id,
        depth: 0,
        req,
      })
      await ensureStripeCustomer({
        account: full,
        payload,
        user: udoc,
      })
    }

    const invDocs = await payload.find({
      collection: 'invoices',
      depth: 1,
      limit: 20,
      pagination: false,
      req,
      where: { invoiceNumber: { contains: 'DEMO-INV' } },
    })
    for (const doc of invDocs.docs) {
      try {
      const inv = doc as Invoice
      const account = inv.account
      if (!account || typeof account !== 'object' || !account.id) continue
      const fullAccount = await payload.findByID({
        collection: 'accounts',
        id: account.id,
          depth: 0,
          req,
        })
        const cu = inv.customerUser
        const u =
          typeof cu === 'object' && cu && 'id' in cu
            ? await payload.findByID({ collection: 'users', id: cu.id, depth: 0, req })
            : null
        await syncInvoiceToStripe({
          account: fullAccount,
          actor: u,
          invoice: inv,
          payload,
        })
        stripeSyncCount += 1
      } catch (syncErr) {
        payload.logger.warn({ err: syncErr, msg: 'Demo seed: single invoice Stripe sync failed.' })
      }
    }
  } catch (e) {
    payload.logger.warn({
      e,
      msg: 'Demo seed: Stripe sync skipped or failed (check STRIPE_SECRET_KEY in test mode).',
    })
  }

  payload.logger.info(
    `— Demo seed finished (Stripe invoice sync attempts: ${stripeSyncCount}). Log in as *@demo.grimetime.local / ${DEMO_CUSTOMER_PASSWORD}.`,
  )
}
