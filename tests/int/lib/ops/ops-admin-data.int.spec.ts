import { describe, expect, it } from 'vitest'

import {
  buildOpsCustomersPageData,
  buildOpsUsersPageData,
} from '@/lib/ops/loaders/opsAdminData'

describe('opsAdminData', () => {
  it('classifies user scope and aggregates memberships into a first-party users directory', () => {
    const data = buildOpsUsersPageData({
      memberships: [
        {
          id: 101,
          organization: {
            id: 201,
            kind: 'staff',
            name: 'Grime Time',
            provider: 'app',
            slug: 'grime-time',
            status: 'active',
          },
          roleTemplate: 'staff-owner',
          status: 'active',
          syncSource: 'app',
          user: {
            id: 1,
            email: 'ops@grimetime.app',
          },
        },
        {
          id: 102,
          organization: {
            id: 202,
            kind: 'customer',
            name: 'North Dock',
            provider: 'clerk',
            slug: 'north-dock',
            status: 'active',
          },
          roleTemplate: 'customer-admin',
          status: 'active',
          syncSource: 'clerk',
          user: {
            id: 1,
            email: 'ops@grimetime.app',
          },
        },
      ],
      users: [
        {
          account: {
            id: 301,
            name: 'North Dock',
          },
          clerkUserID: 'user_123',
          email: 'ops@grimetime.app',
          id: 1,
          name: 'Ops Lead',
          portalInviteState: 'active',
          roles: ['admin'],
        },
        {
          email: 'customer@grimetime.app',
          id: 2,
          name: 'Customer User',
          portalInviteState: 'invite_pending',
          roles: ['customer'],
        },
      ],
    })

    expect(data.cards[0]?.value).toBe('2')
    expect(data.cards[1]?.value).toBe('1')
    expect(data.cards[3]?.value).toBe('1')

    const opsLead = data.rows.find((row) => row.id === '1')
    expect(opsLead).toMatchObject({
      accountName: 'North Dock',
      hasClerkLink: true,
      hasPayloadAdminAccess: true,
      scope: 'hybrid',
    })
    expect(opsLead?.memberships).toHaveLength(2)
    expect(opsLead?.entitlements).toContain('admin:payload')
    expect(opsLead?.entitlements).toContain('portal:access')

    const customerUser = data.rows.find((row) => row.id === '2')
    expect(customerUser?.scope).toBe('unassigned')
    expect(customerUser?.portalInviteState).toBe('invite_pending')
  })

  it('builds account-first customer rows with linked-user and billing signals', () => {
    const data = buildOpsCustomersPageData({
      accounts: [
        {
          accountType: 'commercial',
          billingEmail: 'billing@northdock.com',
          billingMode: 'send_invoice_terms',
          customerUser: {
            email: 'owner@northdock.com',
            name: 'North Dock Owner',
          },
          id: 301,
          name: 'North Dock',
          owner: {
            email: 'ops@grimetime.app',
            name: 'Ops Lead',
          },
          portalAccessMode: 'app_and_stripe',
          status: 'active',
          stripeCustomerID: 'cus_123',
        },
      ],
      users: [
        {
          account: {
            id: 301,
            name: 'North Dock',
          },
          clerkUserID: 'user_123',
          email: 'owner@northdock.com',
          id: 1,
          name: 'North Dock Owner',
          portalInviteState: 'active',
        },
        {
          account: {
            id: 301,
            name: 'North Dock',
          },
          email: 'billing@northdock.com',
          id: 2,
          name: 'Billing Contact',
          portalInviteState: 'invite_pending',
        },
      ],
    })

    expect(data.cards[0]?.value).toBe('1')
    expect(data.cards[1]?.value).toBe('1')
    expect(data.cards[2]?.value).toBe('1')
    expect(data.cards[3]?.value).toBe('1')

    expect(data.rows[0]).toMatchObject({
      accountType: 'commercial',
      billingEmail: 'billing@northdock.com',
      name: 'North Dock',
      ownerName: 'Ops Lead',
      portalAccessMode: 'app_and_stripe',
      primaryCustomerName: 'North Dock Owner',
      stripeCustomerLinked: true,
    })
    expect(data.rows[0]?.linkedUsers).toHaveLength(2)
    expect(data.rows[0]?.linkedUsers[0]?.hasPortalAccess).toBe(true)
  })
})
