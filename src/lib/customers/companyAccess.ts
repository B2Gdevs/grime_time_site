import config from '@payload-config'
import { getPayload } from 'payload'

import { USERS_COLLECTION_SLUG } from '@/collections/Users'
import { relationId } from '@/lib/crm/internal/relationship'
import type { Account, User } from '@/payload-types'
import { isAdminUser } from '@/lib/auth/roles'

export type CompanyAccessMember = {
  email: string
  id: string
  isPrimary: boolean
  lastPortalLoginAt: null | string
  name: string
  portalInviteState: string
}

export type CompanyAccessSummary = {
  accountID: string
  accountName: string
  canInvite: boolean
  members: CompanyAccessMember[]
}

type CompanyAccessAuthority = {
  account: Account
  canInvite: boolean
}

async function loadAccountByID(accountID: number | string): Promise<Account | null> {
  const payload = await getPayload({ config })

  try {
    const account = (await payload.findByID({
      collection: 'accounts',
      depth: 0,
      id: accountID,
      overrideAccess: true,
    })) as Account

    return account
  } catch {
    return null
  }
}

export async function loadCompanyInviteAuthority(user: User): Promise<CompanyAccessAuthority | null> {
  const accountID = relationId(user.account)
  if (accountID == null) {
    return null
  }

  const account = await loadAccountByID(accountID)
  if (!account || account.accountType === 'residential') {
    return null
  }

  const primaryUserID = relationId(account.customerUser)
  const canInvite =
    isAdminUser(user) ||
    (primaryUserID != null && String(primaryUserID) === String(user.id)) ||
    (typeof account.billingEmail === 'string' &&
      account.billingEmail.trim().toLowerCase() === user.email?.trim().toLowerCase())

  return {
    account,
    canInvite,
  }
}

export async function loadCompanyAccessSummary(user: User): Promise<CompanyAccessSummary | null> {
  const authority = await loadCompanyInviteAuthority(user)
  if (!authority) {
    return null
  }

  const payload = await getPayload({ config })
  const members = await payload.find({
    collection: USERS_COLLECTION_SLUG,
    depth: 0,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    sort: 'email',
    where: {
      account: {
        equals: authority.account.id,
      },
    },
  })

  const primaryUserID = relationId(authority.account.customerUser)

  return {
    accountID: String(authority.account.id),
    accountName: authority.account.name,
    canInvite: authority.canInvite,
    members: (members.docs as User[]).map((member) => ({
      email: member.email,
      id: String(member.id),
      isPrimary: primaryUserID != null && String(primaryUserID) === String(member.id),
      lastPortalLoginAt: member.lastPortalLoginAt ?? null,
      name: member.name?.trim() || member.email,
      portalInviteState: member.portalInviteState ?? 'none',
    })),
  }
}
