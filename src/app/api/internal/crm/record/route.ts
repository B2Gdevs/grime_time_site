import { userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import { requirePayloadUser } from '@/lib/auth/requirePayloadUser'
import { loadCrmRecordDetail, type CrmRecordKind } from '@/lib/crm/workspace'

const RECORD_KINDS: CrmRecordKind[] = [
  'account',
  'contact',
  'lead',
  'opportunity',
  'sequence-definition',
  'sequence-enrollment',
  'task',
]

function isRecordKind(value: string): value is CrmRecordKind {
  return RECORD_KINDS.includes(value as CrmRecordKind)
}

export async function GET(request: Request) {
  const auth = await requirePayloadUser(request)

  if (!auth || !userIsAdmin(auth.user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const id = Number(url.searchParams.get('id'))
  const type = url.searchParams.get('type')?.trim()

  if (!type || !isRecordKind(type) || !Number.isInteger(id) || id <= 0) {
    return Response.json({ error: 'Invalid or missing type/id' }, { status: 400 })
  }

  try {
    const detail = await loadCrmRecordDetail({
      id,
      payload: auth.payload,
      type,
      user: auth.user,
    })

    return Response.json(detail)
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to load CRM record detail',
      },
      { status: 404 },
    )
  }
}
