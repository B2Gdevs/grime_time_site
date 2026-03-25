import { z } from 'zod'

import { requireAdminPayload } from '@/lib/auth/requireAdminPayload'
import { setActiveCrmProvider, getCrmRuntimeState } from '@/lib/crm'
import type { CrmProviderSlug } from '@/lib/crm/types'

const crmProviderSchema = z.object({
  provider: z.enum(['engagebay', 'hubspot']),
})

export async function GET(request: Request) {
  const payload = await requireAdminPayload(request)

  if (!payload) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const state = await getCrmRuntimeState()
  return Response.json(state)
}

export async function POST(request: Request) {
  const payload = await requireAdminPayload(request)

  if (!payload) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = crmProviderSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: 'Invalid CRM provider payload' }, { status: 400 })
  }

  try {
    const nextState = await setActiveCrmProvider(parsed.data.provider as CrmProviderSlug)
    payload.logger.info({ provider: nextState.activeProvider }, 'CRM provider toggled from ops dashboard')
    return Response.json(nextState)
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Could not update CRM provider',
      },
      { status: 400 },
    )
  }
}
