import { redirect } from 'next/navigation'

import config from '@payload-config'
import { getPayload, type Where } from 'payload'

import { AdminDashboardView } from '@/components/portal/AdminDashboardView'
import type { SectionCardItem } from '@/components/section-cards'
import { getCurrentPayloadUser, userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import { getCrmRuntimeState } from '@/lib/crm'
import { quotesInternalEnabled } from '@/utilities/quotesAccess'

export default async function OpsDashboardPage() {
  const user = await getCurrentPayloadUser()

  if (!user) {
    return null
  }

  if (!userIsAdmin(user)) {
    redirect('/dashboard')
  }

  const payload = await getPayload({ config })

  const [cards, crmRuntime] = await Promise.all([
    Promise.all([
      safeCountDocs({
        collection: 'form-submissions',
        payload,
        user,
      }),
      quotesInternalEnabled()
        ? safeCountDocs({
            collection: 'quotes',
            payload,
            user,
          })
        : Promise.resolve({ totalDocs: 0, unavailable: false }),
      safeCountDocs({
        collection: 'users',
        payload,
        user,
        where: {
          roles: {
            in: ['customer'],
          },
        },
      }),
    ]).then(([leads, quotes, customers]) => {
      return [
        {
          description: 'Website form submissions captured',
          footer: leads.unavailable
            ? 'Lead counts are temporarily unavailable.'
            : 'Stored in Payload and ready for active CRM follow-up.',
          title: 'Leads',
          trend: leads.unavailable ? 'Unavailable' : `${leads.totalDocs} open`,
          value: String(leads.totalDocs),
        },
        {
          description: 'Quotes currently in the internal workflow',
          footer: quotes.unavailable
            ? 'Quote counts are temporarily unavailable until the quotes schema is synced.'
            : 'Use Payload admin when you need full quote editing.',
          title: 'Quotes',
          trend: quotes.unavailable ? 'Unavailable' : `${quotes.totalDocs} tracked`,
          value: String(quotes.totalDocs),
        },
        {
          description: 'Weighted pipeline target from the phase-06 scorecard',
          footer: 'Keep a 2-4 week forward view before buying new equipment.',
          title: 'Projected revenue',
          trend: 'Target',
          value: '$13.6k',
        },
        {
          description: 'Active maintenance-plan target for steadier cash flow',
          footer: customers.unavailable
            ? 'Customer counts are temporarily unavailable.'
            : `${customers.totalDocs} customer accounts exist; convert repeat work into plans.`,
          title: 'MRR',
          trend: 'Climb',
          value: '$1.8k',
        },
      ] satisfies SectionCardItem[]
    }),
    getCrmRuntimeState(),
  ])

  return (
    <AdminDashboardView
      activeCrmProvider={crmRuntime.activeProvider}
      cards={cards}
      crmProviders={crmRuntime.availableProviders}
    />
  )
}

async function safeCountDocs({
  collection,
  payload,
  user,
  where,
}: {
  collection: 'form-submissions' | 'quotes' | 'users'
  payload: Awaited<ReturnType<typeof getPayload>>
  user: NonNullable<Awaited<ReturnType<typeof getCurrentPayloadUser>>>
  where?: Where
}) {
  try {
    const result = await payload.count({
      collection,
      overrideAccess: false,
      user,
      where,
    })

    return {
      totalDocs: result.totalDocs,
      unavailable: false,
    }
  } catch (error) {
    payload.logger.error({
      collection,
      err: error,
      msg: `Portal dashboard count failed for ${collection}`,
    })

    return {
      totalDocs: 0,
      unavailable: true,
    }
  }
}
