import { userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import { requirePayloadUser } from '@/lib/auth/requirePayloadUser'
import { advanceOpportunityStage } from '@/lib/crm/workspace'

const VALID_STAGES = ['qualified', 'quoted', 'follow_up', 'scheduling', 'won', 'lost'] as const

export async function PATCH(request: Request) {
  const auth = await requirePayloadUser(request)

  if (!auth || !userIsAdmin(auth.user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as null | {
    id?: number
    stage?: (typeof VALID_STAGES)[number]
  }

  if (!body?.id || !body.stage || !VALID_STAGES.includes(body.stage)) {
    return Response.json({ error: 'Invalid or missing id/stage' }, { status: 400 })
  }

  const opportunity = await advanceOpportunityStage({
    id: Number(body.id),
    nextStage: body.stage,
    payload: auth.payload,
    user: auth.user,
  })

  return Response.json({
    id: String(opportunity.id),
    stage: opportunity.stage,
    status: opportunity.status,
  })
}
