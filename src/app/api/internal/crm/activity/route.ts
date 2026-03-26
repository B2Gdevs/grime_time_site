import { userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import { requirePayloadUser } from '@/lib/auth/requirePayloadUser'
import { createCrmActivityNote, type CrmRecordKind } from '@/lib/crm/workspace'

const NOTE_RECORD_KINDS: CrmRecordKind[] = [
  'account',
  'contact',
  'lead',
  'opportunity',
  'sequence-enrollment',
  'task',
]

function canCreateNote(value: string): value is CrmRecordKind {
  return NOTE_RECORD_KINDS.includes(value as CrmRecordKind)
}

export async function POST(request: Request) {
  const auth = await requirePayloadUser(request)

  if (!auth || !userIsAdmin(auth.user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as
    | null
    | {
        body?: string
        recordId?: number
        recordKind?: string
        title?: string
      }

  const noteBody = body?.body?.trim()
  const noteTitle = body?.title?.trim()

  if (!body?.recordId || !body.recordKind || !canCreateNote(body.recordKind) || !noteTitle || !noteBody) {
    return Response.json({ error: 'Invalid or missing note payload' }, { status: 400 })
  }

  try {
    const activity = await createCrmActivityNote({
      body: noteBody,
      payload: auth.payload,
      recordId: Number(body.recordId),
      recordKind: body.recordKind,
      title: noteTitle,
      user: auth.user,
    })

    return Response.json({
      id: String(activity.id),
      occurredAt: activity.occurredAt,
      title: activity.title,
    })
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to create CRM activity note',
      },
      { status: 400 },
    )
  }
}
