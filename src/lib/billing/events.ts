import type { Payload, PayloadRequest } from 'payload'

import type { BillingEvent } from '@/payload-types'

type BillingSnapshotValue =
  | string
  | number
  | boolean
  | null
  | BillingSnapshotValue[]
  | { [key: string]: BillingSnapshotValue }

type CreateBillingEventArgs = {
  accountId?: null | number
  actorId?: null | number
  amount?: null | number
  currency?: null | string
  customerUserId?: null | number
  eventLabel: string
  eventType: BillingEvent['eventType']
  invoiceId?: null | number
  notes?: null | string
  occurredAt?: null | string
  payload: Payload
  payloadSnapshot?: unknown
  paymentReference?: null | string
  paymentSource?: BillingEvent['paymentSource']
  processedAt?: null | string
  reason?: null | string
  req?: PayloadRequest
  serviceAppointmentId?: null | number
  servicePlanId?: null | number
  sourceSystem?: BillingEvent['sourceSystem']
  stripeEventID?: null | string
  stripeObjectID?: null | string
}

function sanitizeBillingSnapshot(value: unknown): BillingSnapshotValue | undefined {
  if (value == null) {
    return value
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => sanitizeBillingSnapshot(entry))
      .filter((entry): entry is BillingSnapshotValue => entry !== undefined)
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, entry]) => [key, sanitizeBillingSnapshot(entry)] as const)
        .filter((entry): entry is readonly [string, BillingSnapshotValue] => entry[1] !== undefined),
    )
  }

  return String(value)
}

export async function createBillingEvent(args: CreateBillingEventArgs) {
  const {
    accountId,
    actorId,
    amount,
    currency,
    customerUserId,
    eventLabel,
    eventType,
    invoiceId,
    notes,
    occurredAt,
    payload,
    payloadSnapshot,
    paymentReference,
    paymentSource,
    processedAt,
    reason,
    req,
    serviceAppointmentId,
    servicePlanId,
    sourceSystem,
    stripeEventID,
    stripeObjectID,
  } = args

  return payload.create({
    collection: 'billing-events',
    data: {
      account: accountId || undefined,
      actor: actorId || undefined,
      amount: typeof amount === 'number' ? amount : undefined,
      currency: currency || 'usd',
      customerUser: customerUserId || undefined,
      eventLabel,
      eventType,
      invoice: invoiceId || undefined,
      notes: notes || undefined,
      occurredAt: occurredAt || new Date().toISOString(),
      payloadSnapshot: sanitizeBillingSnapshot(payloadSnapshot),
      paymentReference: paymentReference || undefined,
      paymentSource: paymentSource || undefined,
      processedAt: processedAt || undefined,
      reason: reason || undefined,
      serviceAppointment: serviceAppointmentId || undefined,
      servicePlan: servicePlanId || undefined,
      sourceSystem: sourceSystem || 'internal',
      stripeEventID: stripeEventID || undefined,
      stripeObjectID: stripeObjectID || undefined,
    },
    req,
  })
}
