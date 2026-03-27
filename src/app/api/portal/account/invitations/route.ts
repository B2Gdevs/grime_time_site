import { requireEffectivePayloadUser } from '@/lib/auth/requirePayloadUser'
import { findCustomerUserByEmail, issuePortalAccess } from '@/lib/auth/portal-access/claims'
import { companyInviteSchema } from '@/lib/forms/portalAccess'
import { loadCompanyInviteAuthority } from '@/lib/customers/companyAccess'
import { relationId } from '@/lib/crm/internal/relationship'
import { USERS_COLLECTION_SLUG } from '@/collections/Users'
import type { User } from '@/payload-types'
import { isAdminUser } from '@/lib/auth/roles'

export async function POST(request: Request) {
  const auth = await requireEffectivePayloadUser(request)

  if (!auth) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const authority = await loadCompanyInviteAuthority(auth.user)
  if (!authority || !authority.canInvite) {
    return Response.json({ error: 'Only the primary company contact can invite teammates.' }, { status: 403 })
  }

  if (!authority.account.customerUser) {
    await auth.payload.update({
      collection: 'accounts',
      id: authority.account.id,
      data: {
        customerUser: auth.user.id,
      },
      overrideAccess: true,
    })
  }

  const body = await request.json().catch(() => null)
  const parsed = companyInviteSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message || 'Invalid invite payload.' },
      { status: 400 },
    )
  }

  const existingUser = await findCustomerUserByEmail(parsed.data.email, auth.payload)

  if (existingUser && isAdminUser(existingUser)) {
    return Response.json({ error: 'Admin users cannot be linked to a customer company account.' }, { status: 409 })
  }

  const existingAccountID = existingUser ? relationId(existingUser.account) : null

  if (existingAccountID != null && String(existingAccountID) !== String(authority.account.id)) {
    return Response.json(
      { error: 'That email is already connected to a different company account.' },
      { status: 409 },
    )
  }

  const user =
    existingUser ||
    ((await auth.payload.create({
      collection: USERS_COLLECTION_SLUG,
      data: {
        account: authority.account.id,
        company: authority.account.name,
        email: parsed.data.email,
        name: parsed.data.name?.trim() || parsed.data.email,
        portalInviteState: 'invite_pending',
        roles: ['customer'],
      },
      overrideAccess: true,
    })) as User)

  const updatedUser = existingUser
    ? ((await auth.payload.update({
        collection: USERS_COLLECTION_SLUG,
        id: existingUser.id,
        data: {
          account: authority.account.id,
          company: authority.account.name,
          name: parsed.data.name?.trim() || existingUser.name || parsed.data.email,
          portalInviteState: 'invite_pending',
        },
        overrideAccess: true,
      })) as User)
    : user

  await issuePortalAccess({
    accountName: authority.account.name,
    mode: 'invite',
    payload: auth.payload,
    user: updatedUser,
  })

  return Response.json({
    member: {
      email: updatedUser.email,
      id: String(updatedUser.id),
      lastPortalLoginAt: updatedUser.lastPortalLoginAt ?? null,
      name: updatedUser.name?.trim() || updatedUser.email,
      portalInviteState: 'invite_pending',
    },
    message: 'Invite sent.',
  })
}
