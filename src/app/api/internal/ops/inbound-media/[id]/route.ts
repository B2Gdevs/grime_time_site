import { userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import { requirePayloadUser } from '@/lib/auth/requirePayloadUser'
import {
  InboundMediaIngestionError,
  requestInboundMediaReplay,
} from '@/lib/media/inboundMediaIngestionWorkspace'

type InboundMediaActionBody = {
  action?: string
  notes?: string
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requirePayloadUser(request)

  if (!auth || !userIsAdmin(auth.user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const ingestionId = Number.parseInt(id, 10)

  if (!Number.isFinite(ingestionId) || ingestionId <= 0) {
    return Response.json({ error: 'Invalid inbound media ingestion id.' }, { status: 400 })
  }

  const body = (await request.json().catch(() => null)) as InboundMediaActionBody | null

  if (body?.action !== 'request_replay') {
    return Response.json({ error: 'Unsupported inbound media action.' }, { status: 400 })
  }

  try {
    const item = await requestInboundMediaReplay({
      id: ingestionId,
      notes: body.notes,
      payload: auth.payload,
      user: auth.user,
    })

    return Response.json({ item })
  } catch (error) {
    if (error instanceof InboundMediaIngestionError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    return Response.json({ error: 'Unable to update inbound media ingestion right now.' }, { status: 500 })
  }
}

