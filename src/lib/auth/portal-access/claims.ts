import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

import { USERS_COLLECTION_SLUG } from '@/collections/Users'
import {
  PORTAL_ACCESS_DEFAULT_NEXT_PATH,
  type PortalInviteState,
} from '@/lib/auth/portal-access/constants'
import { sendPortalAccessEmail } from '@/lib/auth/portal-access/email'
import { provisionPortalAccess } from '@/lib/auth/portal-access/provision'
import { hashPortalAccessToken } from '@/lib/auth/portal-access/token'
import { relationId } from '@/lib/crm/internal/relationship'
import type { Account, User } from '@/payload-types'
import { isAdminUser } from '@/lib/auth/roles'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export type PortalAccessPreview = {
  accountName: null | string
  email: string
  expiresAt: null | string
  mode: 'claim' | 'invite'
  name: null | string
  userID: number | string
}

type IssuePortalAccessArgs = {
  accountName?: null | string
  mode: 'claim' | 'invite'
  nextPath?: string
  payload: Payload
  user: User
}

type CompletePortalAccessArgs = {
  payload?: Payload
  supabaseAuthUserID: string
  token: string
  verifiedEmail: string
}

async function payloadInstance(payload?: Payload): Promise<Payload> {
  return payload ?? getPayload({ config })
}

function previewMode(user: User): 'claim' | 'invite' {
  return user.portalInviteState === 'invite_pending' ? 'invite' : 'claim'
}

async function resolveAccountName(payload: Payload, user: User): Promise<null | string> {
  const accountID = relationId(user.account)
  if (accountID == null) {
    return user.company || null
  }

  try {
    const account = (await payload.findByID({
      collection: 'accounts',
      depth: 0,
      id: accountID,
      overrideAccess: true,
    })) as Account

    return account.name || user.company || null
  } catch {
    return user.company || null
  }
}

export async function issuePortalAccess(args: IssuePortalAccessArgs): Promise<void> {
  const access = await provisionPortalAccess({
    mode: args.mode,
    nextPath: args.nextPath,
    payload: args.payload,
    user: args.user,
  })

  await sendPortalAccessEmail({
    accountName: args.accountName ?? (await resolveAccountName(args.payload, args.user)),
    email: normalizeEmail(args.user.email),
    mode: args.mode,
    name: args.user.name,
    nextPath: args.nextPath ?? PORTAL_ACCESS_DEFAULT_NEXT_PATH,
    payload: args.payload,
    token: access.token,
  })
}

export async function findPortalAccessPreviewByToken(
  token: string,
  payload?: Payload,
): Promise<null | PortalAccessPreview> {
  const currentPayload = await payloadInstance(payload)
  const tokenHash = hashPortalAccessToken(token)
  const result = await currentPayload.find({
    collection: USERS_COLLECTION_SLUG,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      portalInviteTokenHash: {
        equals: tokenHash,
      },
    },
  })

  const user = (result.docs[0] as User | undefined) ?? null
  if (!user || isAdminUser(user)) {
    return null
  }

  const expiresAt = user.portalInviteExpiresAt || null
  if (!expiresAt || new Date(expiresAt).getTime() < Date.now()) {
    return null
  }

  return {
    accountName: await resolveAccountName(currentPayload, user),
    email: normalizeEmail(user.email),
    expiresAt,
    mode: previewMode(user),
    name: user.name || null,
    userID: user.id,
  }
}

export async function completePortalAccessClaim(
  args: CompletePortalAccessArgs,
): Promise<null | User> {
  const currentPayload = await payloadInstance(args.payload)
  const preview = await findPortalAccessPreviewByToken(args.token, currentPayload)
  const verifiedEmail = normalizeEmail(args.verifiedEmail)

  if (!preview || preview.email !== verifiedEmail) {
    return null
  }

  const updated = (await currentPayload.update({
    collection: USERS_COLLECTION_SLUG,
    id: preview.userID,
    data: {
      emailVerifiedAt: new Date().toISOString(),
      lastPortalLoginAt: new Date().toISOString(),
      portalInviteExpiresAt: null,
      portalInviteState: 'active',
      portalInviteTokenHash: null,
      supabaseAuthUserID: args.supabaseAuthUserID,
    },
    overrideAccess: true,
  })) as User

  return updated
}

export async function findCustomerUserByEmail(
  email: string,
  payload?: Payload,
): Promise<null | User> {
  const currentPayload = await payloadInstance(payload)
  const result = await currentPayload.find({
    collection: USERS_COLLECTION_SLUG,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      email: {
        equals: normalizeEmail(email),
      },
    },
  })

  const user = (result.docs[0] as User | undefined) ?? null

  if (!user || isAdminUser(user)) {
    return null
  }

  return user
}

export function userAccountID(user: Pick<User, 'account'>): null | number | string {
  return relationId(user.account)
}
