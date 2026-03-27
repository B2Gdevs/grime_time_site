import type { Where } from 'payload'

const NO_MATCH: Where = { id: { equals: -1 } }

/** Narrow CRM docs that have an `account` relationship to demo accounts. */
export function scopeWhereForAccount(where: Where | undefined, demoAccountIds: number[] | null): Where | undefined {
  if (demoAccountIds === null) return where
  if (demoAccountIds.length === 0) {
    const clause: Where = { account: { equals: -1 } }
    if (!where) return clause
    return { and: [where, clause] }
  }
  const clause: Where = { account: { in: demoAccountIds } }
  if (!where) return clause
  return { and: [where, clause] }
}

/** Narrow `accounts` collection by id list. */
export function scopeWhereForAccountsCollection(
  where: Where | undefined,
  demoAccountIds: number[] | null,
): Where | undefined {
  if (demoAccountIds === null) return where
  if (demoAccountIds.length === 0) {
    if (!where) return NO_MATCH
    return { and: [where, NO_MATCH] }
  }
  const clause: Where = { id: { in: demoAccountIds } }
  if (!where) return clause
  return { and: [where, clause] }
}

/** Narrow `users` to demo portal personas. */
export function scopeWhereForDemoCustomerUsers(where: Where | undefined, demoEmailSuffix: string): Where | undefined {
  const clause: Where = { email: { contains: demoEmailSuffix } }
  if (!where) return clause
  return { and: [where, clause] }
}
