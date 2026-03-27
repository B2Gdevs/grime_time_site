import type { PayloadRequest } from 'payload'

import type { Opportunity } from '@/payload-types'
import type { CrmSyncResult, SubmissionRow } from '@/lib/crm/types'
import { buildCrmTaskData } from '@/lib/crm/tasks/data'
import { buildSubmissionTaskPolicy } from '@/lib/crm/tasks/policy'

import { daysFromNow } from './date'
import { ensureContactAndAccount } from './records'
import { numericRelationId } from './relationship'
import { parseSubmissionRows } from './submissionParser'

export async function syncInternalFormSubmission(
  req: PayloadRequest,
  rows: SubmissionRow[],
): Promise<CrmSyncResult> {
  const parsed = parseSubmissionRows(rows)

  if (!parsed.customerEmail) {
    return {
      detail: 'Lead saved in Payload, but no email was present for CRM matching.',
      status: 'skipped_no_email',
    }
  }

  const { account, contact } = await ensureContactAndAccount(req, {
    accountType: parsed.accountType,
    billingEmail: parsed.customerEmail,
    customerName: parsed.customerName,
    customerPhone: parsed.customerPhone,
    propertyAddress: parsed.propertyAddress,
  })

  const ownerId = numericRelationId(account.owner)
  const lead = await req.payload.create({
    collection: 'leads',
    data: {
      account: account.id,
      contact: contact.id,
      customerEmail: parsed.customerEmail,
      customerName: parsed.customerName ?? contact.fullName,
      customerPhone: parsed.customerPhone ?? undefined,
      notes: parsed.plaintext,
      owner: ownerId ?? undefined,
      priority: parsed.priority,
      serviceAddress: parsed.propertyAddress
        ? {
            street1: parsed.propertyAddress,
          }
        : undefined,
      serviceSummary: parsed.serviceType ?? undefined,
      source: parsed.source,
      staleAt: daysFromNow(parsed.staleDays),
      status: 'new',
      title: parsed.title,
    },
    req,
  })

  const opportunity = (parsed.shouldCreateOpportunity
    ? await req.payload.create({
        collection: 'opportunities',
        data: {
          account: account.id,
          contact: contact.id,
          lead: lead.id,
          nextAction:
            parsed.source === 'schedule_request'
              ? 'Confirm schedule request'
              : 'Review lead and send follow-up',
          nextActionAt: daysFromNow(1),
          owner: ownerId ?? undefined,
          priority: parsed.priority,
          stage: parsed.source === 'instant_quote' ? 'quoted' : 'new_lead',
          status: 'open',
          title: parsed.title,
        },
        req,
      })
    : null) as null | Opportunity

  const taskPolicy = buildSubmissionTaskPolicy({
    submission: parsed,
  })
  const task = await req.payload.create({
    collection: 'crm-tasks',
    data: buildCrmTaskData({
      account: account.id,
      contact: contact.id,
      lead: lead.id,
      notes: parsed.preferredReply
        ? `${parsed.plaintext}\n\nPreferred reply: ${parsed.preferredReply}`
        : parsed.plaintext,
      opportunity: opportunity?.id,
      owner: ownerId ?? undefined,
      policy: taskPolicy,
      taskType:
        parsed.source === 'schedule_request'
          ? 'scheduling'
          : parsed.source === 'instant_quote'
            ? 'quote_follow_up'
            : parsed.requestKind === 'billing_support' || parsed.requestKind === 'refund_request'
              ? 'billing_follow_up'
              : 'general',
      title:
        parsed.source === 'schedule_request'
          ? `Schedule follow-up for ${contact.fullName}`
          : parsed.source === 'instant_quote'
            ? `Quote follow-up for ${contact.fullName}`
            : parsed.requestKind === 'refund_request'
              ? `Refund review for ${contact.fullName}`
              : parsed.requestKind === 'policy_privacy'
                ? `Policy request for ${contact.fullName}`
                : parsed.requestKind === 'billing_support'
                  ? `Billing follow-up for ${contact.fullName}`
                  : `Lead follow-up for ${contact.fullName}`,
    }) as never,
    req,
  })

  await req.payload.create({
    collection: 'crm-activities',
    data: {
      account: account.id,
      activityType: 'system',
      body: parsed.plaintext,
      contact: contact.id,
      direction: 'system',
      lead: lead.id,
      occurredAt: new Date().toISOString(),
      opportunity: opportunity?.id,
      owner: ownerId ?? undefined,
      relatedTask: task.id,
      title: `Inbound ${parsed.source.replaceAll('_', ' ')}`,
    },
    req,
  })

  return {
    detail: `Internal CRM synced: lead ${lead.id}, account ${account.id}, contact ${contact.id}${opportunity ? `, opportunity ${opportunity.id}` : ''}, task ${task.id}.`,
    status: 'ok',
  }
}
