import type { PayloadRequest } from 'payload'

import type { Opportunity } from '@/payload-types'
import type { QuoteDealSyncInput, QuoteSyncResult } from '@/lib/crm/types'

import { daysFromNow } from './date'
import { ensureContactAndAccount, findOpenTaskByReference, findOpportunityByQuoteId } from './records'
import { numericRelationId } from './relationship'

function mapQuoteStage(status: null | string) {
  if (status === 'accepted') return { stage: 'won' as const, status: 'won' as const }
  if (status === 'lost') return { stage: 'lost' as const, status: 'lost' as const }
  return { stage: 'quoted' as const, status: 'open' as const }
}

export async function syncInternalQuote(
  req: PayloadRequest,
  args: {
    operation: 'create' | 'update'
    previousStatus?: null | string
    quote: QuoteDealSyncInput
  },
): Promise<QuoteSyncResult> {
  if (!args.quote.customerEmail?.trim()) {
    return {
      detail: 'Customer email is required before the quote can sync into the internal pipeline.',
      provider: null,
      status: 'skipped_no_email',
    }
  }

  const { stage, status } = mapQuoteStage(args.quote.status ?? null)
  const accountType = args.quote.propertyType?.includes('commercial') ? 'commercial' : 'residential'
  const { account, contact } = await ensureContactAndAccount(req, {
    accountType,
    billingEmail: args.quote.customerEmail,
    customerName: args.quote.customerName,
    customerPhone: args.quote.customerPhone,
    linkedUser: numericRelationId(args.quote.customerUser),
    propertyAddress: args.quote.serviceAddress?.street1,
  })

  const ownerId = numericRelationId(account.owner)
  const quoteId = numericRelationId(args.quote.id)
  const existingOpportunity = quoteId ? await findOpportunityByQuoteId(req, quoteId) : null
  const opportunity = (existingOpportunity?.id
    ? await req.payload.update({
        collection: 'opportunities',
        id: existingOpportunity.id,
        data: {
          account: account.id,
          contact: contact.id,
          expectedCloseDate: args.quote.validUntil ?? undefined,
          lastActivityAt: new Date().toISOString(),
          nextAction:
            status === 'won'
              ? 'Coordinate scheduling'
              : status === 'lost'
                ? 'Record loss reason and close out'
                : 'Follow up on sent quote',
          nextActionAt: status === 'won' ? daysFromNow(1) : status === 'lost' ? undefined : daysFromNow(2),
          owner: ownerId ?? undefined,
          priority: accountType === 'commercial' ? 'high' : 'medium',
          quote: quoteId ?? undefined,
          stage,
          status,
          title: args.quote.title ?? `${contact.fullName} quote`,
          value: args.quote.pricing?.total ?? undefined,
        },
        req,
      })
    : await req.payload.create({
        collection: 'opportunities',
        data: {
          account: account.id,
          contact: contact.id,
          expectedCloseDate: args.quote.validUntil ?? undefined,
          nextAction: status === 'won' ? 'Coordinate scheduling' : 'Follow up on sent quote',
          nextActionAt: status === 'won' ? daysFromNow(1) : daysFromNow(2),
          owner: ownerId ?? undefined,
          priority: accountType === 'commercial' ? 'high' : 'medium',
          quote: quoteId ?? undefined,
          stage,
          status,
          title: args.quote.title ?? `${contact.fullName} quote`,
          value: args.quote.pricing?.total ?? undefined,
        },
        req,
      })) as Opportunity

  const existingTask = quoteId
    ? await findOpenTaskByReference({
        opportunity: opportunity.id,
        quote: quoteId,
        req,
        taskType: status === 'won' ? 'scheduling' : 'quote_follow_up',
      })
    : null

  if (!existingTask && status !== 'lost') {
    await req.payload.create({
      collection: 'crm-tasks',
      data: {
        account: account.id,
        contact: contact.id,
        dueAt: status === 'won' ? daysFromNow(1) : daysFromNow(2),
        notes:
          status === 'won'
            ? 'Quote accepted. Coordinate schedule and next steps.'
            : 'Quote sent. Follow up if the customer has not responded.',
        opportunity: opportunity.id,
        owner: ownerId ?? undefined,
        priority: accountType === 'commercial' ? 'high' : 'medium',
        quote: quoteId ?? undefined,
        staleAt: status === 'won' ? daysFromNow(2) : daysFromNow(3),
        status: 'open',
        taskType: status === 'won' ? 'scheduling' : 'quote_follow_up',
        title:
          status === 'won'
            ? `Schedule job for ${contact.fullName}`
            : `Follow up quote for ${contact.fullName}`,
      },
      req,
    })
  }

  if (args.previousStatus !== args.quote.status) {
    await req.payload.create({
      collection: 'crm-activities',
      data: {
        account: account.id,
        activityType: 'system',
        body:
          status === 'won'
            ? 'Quote accepted and opportunity marked won.'
            : status === 'lost'
              ? 'Quote marked lost.'
              : 'Quote sent and opportunity moved into follow-up.',
        contact: contact.id,
        direction: 'system',
        occurredAt: new Date().toISOString(),
        opportunity: opportunity.id,
        owner: ownerId ?? undefined,
        quote: quoteId ?? undefined,
        title: `Quote status: ${args.quote.status ?? 'draft'}`,
      },
      req,
    })
  }

  return {
    detail: `Internal CRM synced: opportunity ${opportunity.id} for quote ${quoteId ?? 'draft'}.`,
    provider: null,
    status: 'ok',
  }
}
