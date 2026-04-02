import type { Payload } from 'payload'

import type { User } from '@/payload-types'
import { isClerkCustomerAuthPrimaryServer } from '@/lib/auth/customerAuthMode'
import { ensureBootstrapOrganizationMembership } from '@/lib/auth/organizationSync'
import { resolveCustomerPayloadUser } from '@/lib/auth/resolveCustomerPayloadUser'

type ResolvedCustomerAuth = Awaited<ReturnType<typeof resolveCustomerPayloadUser>>

export type AppAuthActor = {
  customerAuth: null | ResolvedCustomerAuth
  payload: Payload
  payloadUser: User | null
  realUser: User | null
}

export async function resolveAppAuthActor(args: {
  payload: Payload
  payloadHeaderCandidates?: Array<Headers | null | undefined>
}): Promise<AppAuthActor> {
  const payloadUser = await resolvePayloadSessionUser(args.payload, args.payloadHeaderCandidates ?? [])

  if (isClerkCustomerAuthPrimaryServer()) {
    const customerAuth = await resolveCustomerPayloadUser()
    if (customerAuth?.user) {
      await ensureBootstrapOrganizationMembership(customerAuth.payload, customerAuth.user)
    }

    return {
      customerAuth,
      payload: customerAuth?.payload ?? args.payload,
      payloadUser,
      realUser: customerAuth?.user ?? payloadUser,
    }
  }

  const customerAuth = payloadUser ? null : await resolveCustomerPayloadUser()
  const realUser = payloadUser ?? customerAuth?.user ?? null

  if (realUser) {
    await ensureBootstrapOrganizationMembership(customerAuth?.payload ?? args.payload, realUser)
  }

  return {
    customerAuth,
    payload: customerAuth?.payload ?? args.payload,
    payloadUser,
    realUser,
  }
}

async function resolvePayloadSessionUser(
  payload: Payload,
  headerCandidates: Array<Headers | null | undefined>,
): Promise<User | null> {
  for (const candidate of headerCandidates) {
    if (!candidate) {
      continue
    }

    try {
      const { user } = await payload.auth({ headers: candidate })

      if (user) {
        return (user as User) ?? null
      }
    } catch {
      // Ignore invalid or missing Payload session headers and continue to the next auth path.
    }
  }

  return null
}
