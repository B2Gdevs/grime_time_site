import config from '@payload-config'
import { getPayload } from 'payload'
import { z } from 'zod'

import { setActiveCrmProvider, getCrmRuntimeState } from '@/lib/crm'
import type { CrmProviderSlug } from '@/lib/crm/types'
import { userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import type { User } from '@/payload-types'

const crmProviderSchema = z.object({
  provider: z.enum(['engagebay', 'hubspot']),
})

async function requireAdmin(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })

  if (!userIsAdmin(user as User | null)) {
    return null
  }

  return payload
}

export async function GET(request: Request) {
  const payload = await requireAdmin(request)

  if (!payload) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const state = await getCrmRuntimeState()
  return Response.json(state)
}

export async function POST(request: Request) {
  const payload = await requireAdmin(request)

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
