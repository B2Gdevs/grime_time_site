import type { Where } from 'payload'

import { relationId } from '@/lib/crm/internal/relationship'
import { authEntityEmail, authEntityId, isAdminUser, type RoleCarrier } from '@/lib/auth/roles'

type OwnershipOptions = {
  accountField?: string
  allowAdminBypass?: boolean
  emailField?: string
  relationField?: string
}

export function buildCustomerOwnershipWhere(
  user: RoleCarrier,
  options: OwnershipOptions = {},
): true | false | Where {
  if (!user) return false
  if (options.allowAdminBypass !== false && isAdminUser(user)) return true

  const accountField = options.accountField ?? 'account'
  const relationField = options.relationField ?? 'customerUser'
  const emailField = options.emailField ?? 'customerEmail'
  const accountId =
    user && typeof user === 'object' && 'account' in user
      ? relationId((user as { account?: null | number | string | { id?: null | number | string } }).account)
      : null
  const userId = authEntityId(user)
  const userEmail = authEntityEmail(user)?.trim().toLowerCase()
  const or: Where['or'] = []

  if (accountId != null) {
    or.push({
      [accountField]: {
        equals: accountId,
      },
    })
  }

  if (userId != null) {
    or.push({
      [relationField]: {
        equals: userId,
      },
    })
  }

  if (userEmail) {
    or.push({
      [emailField]: {
        equals: userEmail,
      },
    })
  }

  return or.length > 0 ? { or } : false
}

export function customerMatchesDocument(
  user: RoleCarrier,
  doc: Record<string, unknown> | null | undefined,
  options: OwnershipOptions = {},
): boolean {
  if (!user || !doc) return false
  if (isAdminUser(user)) return true

  const accountField = options.accountField ?? 'account'
  const relationField = options.relationField ?? 'customerUser'
  const emailField = options.emailField ?? 'customerEmail'
  const accountId =
    user && typeof user === 'object' && 'account' in user
      ? relationId((user as { account?: null | number | string | { id?: null | number | string } }).account)
      : null
  const userId = authEntityId(user)
  const userEmail = authEntityEmail(user)?.trim().toLowerCase()

  const accountValue = doc[accountField]
  const docAccountId =
    accountValue && typeof accountValue === 'object' && 'id' in accountValue
      ? (accountValue as { id?: number | string | null }).id
      : accountValue

  if (accountId != null && docAccountId != null && String(docAccountId) === String(accountId)) {
    return true
  }

  const relationValue = doc[relationField]
  const docRelationId =
    relationValue && typeof relationValue === 'object' && 'id' in relationValue
      ? (relationValue as { id?: number | string | null }).id
      : relationValue

  if (userId != null && docRelationId != null && String(docRelationId) === String(userId)) {
    return true
  }

  const emailValue = doc[emailField]
  return typeof emailValue === 'string' && userEmail ? emailValue.trim().toLowerCase() === userEmail : false
}
