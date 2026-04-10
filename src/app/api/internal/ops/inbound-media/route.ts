import { userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import { requirePayloadUser } from '@/lib/auth/requirePayloadUser'
import {
  inboundMediaIngestionStatusOptions,
  type InboundMediaIngestionStatus,
} from '@/lib/media/inboundMediaIngestion'
import { loadInboundMediaIngestionWorkspace } from '@/lib/media/inboundMediaIngestionWorkspace'

const VALID_STATUSES = new Set<InboundMediaIngestionStatus>(
  inboundMediaIngestionStatusOptions.map((option) => option.value),
)

function parseStatus(value: null | string): InboundMediaIngestionStatus | undefined {
  if (value && VALID_STATUSES.has(value as InboundMediaIngestionStatus)) {
    return value as InboundMediaIngestionStatus
  }

  return undefined
}

export async function GET(request: Request) {
  const auth = await requirePayloadUser(request)

  if (!auth || !userIsAdmin(auth.user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const items = await loadInboundMediaIngestionWorkspace({
    payload: auth.payload,
    searchQuery: url.searchParams.get('q')?.trim() || undefined,
    status: parseStatus(url.searchParams.get('status')),
    user: auth.user,
  })

  return Response.json({ items })
}

