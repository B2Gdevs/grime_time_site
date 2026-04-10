import type { Payload } from 'payload'

import { issuePortalAccess } from '@/lib/auth/portal-access/claims'
import { ensureStripeCustomer } from '@/lib/billing/stripe/customers'
import { relationId } from '@/lib/crm/internal/relationship'
import type { Account, User } from '@/payload-types'

export type OpsCustomerAdminAction =
  | { action: 'clear_portal_access'; userId: number }
  | { action: 'clear_primary_customer' }
  | { action: 'clear_stripe_customer' }
  | { action: 'repair_stripe_customer'; userId?: number }
  | { action: 'send_portal_access'; userId: number }
  | { action: 'set_primary_customer'; userId: number }

export class OpsCustomerAdminError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'OpsCustomerAdminError'
    this.status = status
  }
}

async function loadTargetAccount(payload: Payload, accountId: number): Promise<Account> {
  const account = (await payload.findByID({
    collection: 'accounts',
    depth: 0,
    id: accountId,
    overrideAccess: true,
  })) as Account | null

  if (!account) {
    throw new OpsCustomerAdminError('Account not found.', 404)
  }

  return account
}

async function loadTargetUser(payload: Payload, userId: number): Promise<User> {
  const user = (await payload.findByID({
    collection: 'users',
    depth: 0,
    id: userId,
    overrideAccess: true,
  })) as User | null

  if (!user) {
    throw new OpsCustomerAdminError('User not found.', 404)
  }

  return user
}

function assertUserLinkedToAccount(user: Pick<User, 'account'>, accountId: number) {
  if (Number(relationId(user.account)) !== accountId) {
    throw new OpsCustomerAdminError('That user is not linked to the selected account.', 409)
  }
}

async function findAnyLinkedUser(payload: Payload, accountId: number): Promise<null | User> {
  const result = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      account: {
        equals: accountId,
      },
    },
  })

  return ((result.docs[0] as User | undefined) ?? null) as User | null
}

export async function performOpsCustomerAdminAction(args: {
  action: OpsCustomerAdminAction
  payload: Payload
  targetAccountId: number
}) {
  const account = await loadTargetAccount(args.payload, args.targetAccountId)

  if (args.action.action === 'clear_primary_customer') {
    await args.payload.update({
      collection: 'accounts',
      id: account.id,
      data: {
        customerUser: null,
      },
      overrideAccess: true,
    })

    return { message: 'Primary customer cleared for this account.' }
  }

  if (args.action.action === 'set_primary_customer') {
    const user = await loadTargetUser(args.payload, args.action.userId)
    assertUserLinkedToAccount(user, args.targetAccountId)

    await args.payload.update({
      collection: 'accounts',
      id: account.id,
      data: {
        customerUser: user.id,
      },
      overrideAccess: true,
    })

    return { message: 'Primary customer updated for this account.' }
  }

  if (args.action.action === 'clear_portal_access') {
    const user = await loadTargetUser(args.payload, args.action.userId)
    assertUserLinkedToAccount(user, args.targetAccountId)

    await args.payload.update({
      collection: 'users',
      id: user.id,
      data: {
        lastPortalLoginAt: null,
        portalInviteExpiresAt: null,
        portalInviteSentAt: null,
        portalInviteState: 'none',
        portalInviteTokenHash: null,
      },
      overrideAccess: true,
    })

    return { message: 'Portal access state cleared for the selected linked user.' }
  }

  if (args.action.action === 'send_portal_access') {
    const user = await loadTargetUser(args.payload, args.action.userId)
    assertUserLinkedToAccount(user, args.targetAccountId)

    await issuePortalAccess({
      accountName: account.name,
      mode: user.portalInviteState === 'invite_pending' ? 'invite' : 'claim',
      payload: args.payload,
      user,
    })

    return { message: 'Portal access email queued for the selected linked user.' }
  }

  if (args.action.action === 'clear_stripe_customer') {
    await args.payload.update({
      collection: 'accounts',
      id: account.id,
      data: {
        billingPortalLastSharedAt: null,
        stripeCustomerID: null,
        stripeDefaultPaymentMethodID: null,
      },
      overrideAccess: true,
    })

    return { message: 'Stripe customer linkage cleared for this account.' }
  }

  const fallbackUser =
    (typeof args.action.userId === 'number' ? await loadTargetUser(args.payload, args.action.userId) : null) ||
    (account.customerUser ? await loadTargetUser(args.payload, Number(relationId(account.customerUser))) : null) ||
    (await findAnyLinkedUser(args.payload, args.targetAccountId))

  if (fallbackUser) {
    assertUserLinkedToAccount(fallbackUser, args.targetAccountId)
  }

  const stripeCustomerID = await ensureStripeCustomer({
    account,
    payload: args.payload,
    user: fallbackUser,
  })

  return { message: `Stripe customer linked as ${stripeCustomerID}.` }
}
