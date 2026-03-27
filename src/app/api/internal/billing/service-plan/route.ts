import { z } from 'zod'

import { userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import { requirePayloadUser } from '@/lib/auth/requirePayloadUser'
import { createOrSyncServicePlanSubscription } from '@/lib/billing/stripe/subscriptions'
import type { Account, ServicePlan } from '@/payload-types'

const servicePlanSchema = z.object({
  id: z.number().int().positive(),
})

export async function POST(request: Request) {
  const auth = await requirePayloadUser(request)

  if (!auth || !userIsAdmin(auth.user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = servicePlanSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message || 'Invalid service-plan payload.' }, { status: 400 })
  }

  const plan = (await auth.payload.findByID({
    collection: 'service-plans',
    depth: 1,
    id: parsed.data.id,
    overrideAccess: false,
    user: auth.user,
  })) as ServicePlan

  const accountId =
    typeof plan.account === 'number' || typeof plan.account === 'string' ? plan.account : plan.account?.id

  if (!accountId) {
    return Response.json({ error: 'This service plan is missing an account.' }, { status: 400 })
  }

  const account = (await auth.payload.findByID({
    collection: 'accounts',
    depth: 0,
    id: accountId,
    overrideAccess: false,
    user: auth.user,
  })) as Account

  const syncedPlan = await createOrSyncServicePlanSubscription({
    account,
    payload: auth.payload,
    plan,
    user: auth.user,
  })

  return Response.json({
    id: String(syncedPlan?.id || plan.id),
    stripeSubscriptionID: syncedPlan?.stripeSubscriptionID || plan.stripeSubscriptionID || null,
    status: syncedPlan?.status || plan.status,
  })
}
