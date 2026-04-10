import { z } from 'zod'

import { requireRequestAuth } from '@/lib/auth/requirePayloadUser'
import {
  OpsStaffAdminError,
  performOpsUserAdminAction,
  type OpsUserAdminAction,
} from '@/lib/ops/staffAdmin'

type RouteContext = {
  params: Promise<{ id: string }>
}

const staffRoleTemplates = [
  'staff-owner',
  'staff-admin',
  'staff-designer',
  'staff-operator',
] as const

const userActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('resync_provider'),
  }),
  z.object({
    action: z.literal('revoke_staff_invite'),
  }),
  z.object({
    action: z.literal('reactivate_staff_access'),
  }),
  z.object({
    action: z.literal('send_staff_invite'),
    roleTemplate: z.enum(staffRoleTemplates),
  }),
  z.object({
    action: z.literal('suspend_staff_access'),
  }),
  z.object({
    action: z.literal('update_staff_role'),
    roleTemplate: z.enum(staffRoleTemplates),
  }),
])

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireRequestAuth(request)

  if (!auth?.isRealAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const params = await context.params
  const id = Number(params.id)

  if (!Number.isFinite(id) || id <= 0) {
    return Response.json({ error: 'Invalid user id.' }, { status: 400 })
  }

  const parsed = userActionSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message || 'Invalid user action payload.' },
      { status: 400 },
    )
  }

  try {
    const result = await performOpsUserAdminAction({
      action: parsed.data as OpsUserAdminAction,
      actor: auth.realUser,
      payload: auth.payload,
      targetUserId: id,
    })

    return Response.json(result)
  } catch (error) {
    if (error instanceof OpsStaffAdminError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    return Response.json({ error: 'Unable to update staff access right now.' }, { status: 500 })
  }
}
