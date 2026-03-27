import type { PayloadRequest } from 'payload'

import { resolveSeedStaffEmails } from '@/utilities/quotesAccess'

import { numericRelationId } from './relationship'

export async function resolveDefaultCrmOwner(args: {
  accountOwner?: null | number | string
  preferredOwner?: null | number | string
  req: PayloadRequest
}) {
  const explicitOwner = numericRelationId(args.preferredOwner)
  if (explicitOwner) {
    return explicitOwner
  }

  const accountOwner = numericRelationId(args.accountOwner)
  if (accountOwner) {
    return accountOwner
  }

  const preferredEmails = resolveSeedStaffEmails()

  if (preferredEmails.length > 0) {
    const preferredStaff = await args.req.payload.find({
      collection: 'users',
      depth: 0,
      limit: preferredEmails.length,
      overrideAccess: true,
      pagination: false,
      req: args.req,
      sort: 'createdAt',
      where: {
        email: {
          in: preferredEmails,
        },
      },
    })

    const stableStaff = preferredEmails
      .map((email) => preferredStaff.docs.find((user) => user.email === email && user.roles?.includes('admin')))
      .find(Boolean)

    if (stableStaff?.id) {
      return Number(stableStaff.id)
    }
  }

  const firstAdmin = await args.req.payload.find({
    collection: 'users',
    depth: 0,
    limit: 20,
    overrideAccess: true,
    pagination: false,
    req: args.req,
    sort: 'createdAt',
  })

  const adminDoc = firstAdmin.docs.find((user) => user.roles?.includes('admin'))
  return adminDoc?.id ? Number(adminDoc.id) : null
}
