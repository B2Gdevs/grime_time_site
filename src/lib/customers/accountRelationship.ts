import type { CollectionBeforeValidateHook, PayloadRequest } from 'payload'

import { relationId } from '@/lib/crm/internal/relationship'

type CustomerRelationshipData = {
  account?: null | number | string
  customerEmail?: null | string
  customerUser?: null | number | string
}

function numericId(value: null | number | string | undefined): null | number {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value
  }

  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) ? parsed : null
}

function normalizeEmail(value: unknown): null | string {
  return typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : null
}

async function findAccountIdByEmail(req: PayloadRequest, email: string): Promise<null | number> {
  const accounts = await req.payload.find({
    collection: 'accounts',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      or: [
        {
          billingEmail: {
            equals: email,
          },
        },
        {
          accountsPayableEmail: {
            equals: email,
          },
        },
      ],
    },
  })

  return numericId(accounts.docs[0]?.id)
}

async function findAccountIdByUser(req: PayloadRequest, userRef: unknown): Promise<null | number> {
  const userId = numericId(
    relationId(userRef as null | number | string | { id?: null | number | string } | undefined),
  )

  if (userId == null) {
    return null
  }

  const user = await req.payload.findByID({
    collection: 'users',
    depth: 0,
    id: userId,
    overrideAccess: true,
    req,
  })

  return numericId(relationId(user.account))
}

export function createAssignCustomerAccountHook(): CollectionBeforeValidateHook {
  return async ({ data, originalDoc, req }) => {
    if (!data) {
      return data
    }

    const typedData = data as CustomerRelationshipData
    const currentData = (originalDoc ?? {}) as CustomerRelationshipData
    const customerEmail = normalizeEmail(typedData.customerEmail ?? currentData.customerEmail)

    let accountId =
      numericId(relationId(typedData.account)) ?? numericId(relationId(currentData.account))

    if (accountId == null) {
      accountId = await findAccountIdByUser(req, typedData.customerUser ?? currentData.customerUser)
    }

    if (accountId == null && customerEmail) {
      accountId = await findAccountIdByEmail(req, customerEmail)
    }

    return {
      ...data,
      account: accountId ?? typedData.account,
      customerEmail: customerEmail ?? typedData.customerEmail,
    }
  }
}
