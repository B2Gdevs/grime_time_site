import { auth, clerkClient } from '@clerk/nextjs/server'

import {
  isClerkCustomerAuthPrimaryServer,
  isSupabaseCustomerAuthFallbackEnabledServer,
} from '@/lib/auth/customerAuthMode'
import { getSupabaseServerUser } from '@/lib/supabase/server'

export type ClerkOrganizationMembershipIdentity = {
  clerkMembershipID: string
  clerkOrgID: string
  role: null | string
}

export type CustomerSessionIdentity =
  | {
      clerkUserID: string
      email: string
      firstName: null | string
      kind: 'clerk'
      lastName: null | string
      organizationMemberships: ClerkOrganizationMembershipIdentity[]
      user_metadata: Record<string, unknown>
    }
  | {
      email: string
      kind: 'supabase'
      supabaseAuthUserID: string
      user_metadata: Record<string, unknown>
    }

export async function resolveCustomerSessionIdentity(): Promise<CustomerSessionIdentity | null> {
  if (isClerkCustomerAuthPrimaryServer()) {
    return resolveClerkCustomerIdentity()
  }

  if (!isSupabaseCustomerAuthFallbackEnabledServer()) {
    return null
  }

  return resolveSupabaseCustomerIdentity()
}

async function resolveClerkCustomerIdentity(): Promise<CustomerSessionIdentity | null> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return null
    }

    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const membershipsResponse = await client.users
      .getOrganizationMembershipList({
        limit: 100,
        userId,
      })
      .catch(() => ({ data: [] }))
    const primaryEmail =
      user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)?.emailAddress ||
      user.emailAddresses[0]?.emailAddress
    const organizationMemberships = (membershipsResponse.data || [])
      .map((membership) => ({
        clerkMembershipID: membership.id,
        clerkOrgID: membership.organization.id,
        role: membership.role || null,
      }))
      .filter((membership) => membership.clerkMembershipID && membership.clerkOrgID)

    if (!primaryEmail) {
      return null
    }

    return {
      clerkUserID: user.id,
      email: primaryEmail.trim().toLowerCase(),
      firstName: user.firstName,
      kind: 'clerk',
      lastName: user.lastName,
      organizationMemberships,
      user_metadata: {
        name: [user.firstName, user.lastName].filter(Boolean).join(' '),
        username: user.username,
      },
    }
  } catch {
    return null
  }
}

async function resolveSupabaseCustomerIdentity(): Promise<CustomerSessionIdentity | null> {
  const user = await getSupabaseServerUser()

  if (!user?.id || !user.email?.trim()) {
    return null
  }

  return {
    email: user.email.trim().toLowerCase(),
    kind: 'supabase',
    supabaseAuthUserID: user.id,
    user_metadata: user.user_metadata ?? {},
  }
}
