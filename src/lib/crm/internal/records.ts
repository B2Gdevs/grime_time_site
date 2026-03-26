import type { PayloadRequest, Where } from 'payload'

import type { Account, Contact, CrmTask, Opportunity } from '@/payload-types'

import { numericRelationId, relationId } from './relationship'

type EnsureCrmPartyArgs = {
  accountType: 'commercial' | 'residential'
  billingEmail?: null | string
  customerName?: null | string
  customerPhone?: null | string
  linkedUser?: null | number | string
  owner?: null | number | string
  propertyAddress?: null | string
}

async function findFirstByWhere<T>(args: {
  collection: 'accounts' | 'contacts' | 'crm-tasks' | 'opportunities'
  req: PayloadRequest
  where: Where
}): Promise<T | null> {
  const result = await args.req.payload.find({
    collection: args.collection,
    depth: 0,
    limit: 1,
    pagination: false,
    req: args.req,
    where: args.where,
  })

  return (result.docs[0] as T | undefined) ?? null
}

export async function ensureContactAndAccount(req: PayloadRequest, args: EnsureCrmPartyArgs) {
  const ownerId = numericRelationId(args.owner)
  const linkedUserId = numericRelationId(args.linkedUser)
  const email = args.billingEmail?.trim().toLowerCase() ?? null
  const name = args.customerName?.trim() || email || 'Unnamed account'
  const propertyAddress = args.propertyAddress?.trim() || null

  const existingContact =
    email
      ? await findFirstByWhere<{ account?: number | null; id: number }>({
          collection: 'contacts',
          req,
          where: {
            email: {
              equals: email,
            },
          },
        })
      : null

  const existingAccountId = numericRelationId(existingContact?.account)
  const existingAccount =
    existingAccountId
      ? ({ id: existingAccountId } as const)
      : email
        ? await findFirstByWhere<{ id: number }>({
            collection: 'accounts',
            req,
            where: {
              billingEmail: {
                equals: email,
              },
            },
          })
        : null

  const account = (existingAccount?.id
    ? await req.payload.update({
        collection: 'accounts',
        id: existingAccount.id,
        data: {
          accountType: args.accountType,
          billingEmail: email,
          customerUser: linkedUserId ?? undefined,
          name,
          owner: ownerId ?? undefined,
          serviceAddress: propertyAddress
            ? {
                street1: propertyAddress,
              }
            : undefined,
        },
        req,
      })
    : await req.payload.create({
        collection: 'accounts',
        data: {
          accountType: args.accountType,
          billingEmail: email,
          customerUser: linkedUserId ?? undefined,
          name,
          owner: ownerId ?? undefined,
          serviceAddress: propertyAddress
            ? {
                street1: propertyAddress,
              }
            : undefined,
          status: 'prospect',
        },
        req,
      })) as Account

  const contact = (existingContact?.id
    ? await req.payload.update({
        collection: 'contacts',
        id: existingContact.id,
        data: {
          account: account.id,
          email: email ?? undefined,
          fullName: name,
          lastContactAt: new Date().toISOString(),
          linkedUser: linkedUserId ?? undefined,
          owner: ownerId ?? undefined,
          phone: args.customerPhone ?? undefined,
          status: 'active',
        },
        req,
      })
    : await req.payload.create({
        collection: 'contacts',
        data: {
          account: account.id,
          email: email ?? `${Date.now()}@grimetime.local`,
          fullName: name,
          lastContactAt: new Date().toISOString(),
          linkedUser: linkedUserId ?? undefined,
          owner: ownerId ?? undefined,
          phone: args.customerPhone ?? undefined,
          roles: ['primary'],
          status: 'active',
        },
        req,
      })) as Contact

  if (relationId(account.primaryContact) !== contact.id) {
    await req.payload.update({
      collection: 'accounts',
      id: account.id,
      data: {
        primaryContact: contact.id,
      },
      req,
    })
  }

  return { account, contact }
}

export async function findOpportunityByQuoteId(req: PayloadRequest, quoteId: number) {
  return findFirstByWhere<Opportunity>({
    collection: 'opportunities',
    req,
    where: {
      quote: {
        equals: quoteId,
      },
    },
  })
}

export async function findOpenTaskByReference(args: {
  opportunity?: null | number
  quote?: null | number
  req: PayloadRequest
  taskType: string
}) {
  const and: Where[] = [
    {
      taskType: {
        equals: args.taskType,
      },
    },
    {
      status: {
        in: ['open', 'in_progress', 'waiting'],
      },
    },
  ]

  if (args.opportunity) {
    and.push({
      opportunity: {
        equals: args.opportunity,
      },
    })
  }

  if (args.quote) {
    and.push({
      quote: {
        equals: args.quote,
      },
    })
  }

  return findFirstByWhere<CrmTask>({
    collection: 'crm-tasks',
    req: args.req,
    where: { and },
  })
}
