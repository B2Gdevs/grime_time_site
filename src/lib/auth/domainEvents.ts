import type { Payload, PayloadRequest } from 'payload'

type AuthDomainEventType =
  | 'membership_entitlement_locked'
  | 'membership_entitlement_unlocked'
  | 'membership_invite_revoked'
  | 'membership_invite_sent'
  | 'membership_provider_resynced'
  | 'membership_role_changed'
  | 'membership_status_changed'
  | 'membership_synced'

type CreateAuthDomainEventArgs = {
  actorId?: null | number
  details?: null | Record<string, null | number | string | boolean>
  eventLabel: string
  eventType: AuthDomainEventType
  membershipId?: null | number
  occurredAt?: null | string
  organizationId?: null | number
  payload: Payload
  req?: PayloadRequest
  sourceSystem?: 'app' | 'clerk' | 'reconciliation' | 'webhook'
  targetUserId?: null | number
}

function buildEventBody(args: Omit<CreateAuthDomainEventArgs, 'payload' | 'req'>) {
  const lines = [
    `eventType=${args.eventType}`,
    `sourceSystem=${args.sourceSystem || 'app'}`,
  ]

  if (typeof args.targetUserId === 'number') {
    lines.push(`targetUserId=${args.targetUserId}`)
  }

  if (typeof args.organizationId === 'number') {
    lines.push(`organizationId=${args.organizationId}`)
  }

  if (typeof args.membershipId === 'number') {
    lines.push(`membershipId=${args.membershipId}`)
  }

  Object.entries(args.details || {}).forEach(([key, value]) => {
    if (value == null) {
      return
    }

    lines.push(`${key}=${String(value)}`)
  })

  return lines.join('\n')
}

export async function createAuthDomainEvent(args: CreateAuthDomainEventArgs) {
  return args.payload.create({
    collection: 'crm-activities',
    data: {
      activityType: 'system',
      body: buildEventBody(args),
      direction: 'system',
      occurredAt: args.occurredAt || new Date().toISOString(),
      owner: args.actorId || undefined,
      title: args.eventLabel,
    },
    overrideAccess: true,
    req: args.req,
  })
}
