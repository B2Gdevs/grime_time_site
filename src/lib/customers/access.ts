import type { Where } from 'payload'

import { authEntityEmail, authEntityId, isAdminUser, type RoleCarrier } from '@/lib/auth/roles'

type OwnershipOptions = {
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

  const relationField = options.relationField ?? 'customerUser'
  const emailField = options.emailField ?? 'customerEmail'
  const userId = authEntityId(user)
  const userEmail = authEntityEmail(user)?.trim().toLowerCase()
  const or: Where['or'] = []

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

  const relationField = options.relationField ?? 'customerUser'
  const emailField = options.emailField ?? 'customerEmail'
  const userId = authEntityId(user)
  const userEmail = authEntityEmail(user)?.trim().toLowerCase()

  const relationValue = doc[relationField]
  const relationId =
    relationValue && typeof relationValue === 'object' && 'id' in relationValue
      ? (relationValue as { id?: number | string | null }).id
      : relationValue

  if (userId != null && relationId != null && String(relationId) === String(userId)) {
    return true
  }

  const emailValue = doc[emailField]
  return typeof emailValue === 'string' && userEmail ? emailValue.trim().toLowerCase() === userEmail : false
}
