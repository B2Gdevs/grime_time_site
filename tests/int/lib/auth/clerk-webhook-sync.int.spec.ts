import { beforeEach, describe, expect, it, vi } from 'vitest'

const createAuthDomainEvent = vi.fn()
const syncUserLegacyRolesFromMemberships = vi.fn()
const getUserOrganizationMembership = vi.fn()

vi.mock('@/lib/auth/domainEvents', () => ({
  createAuthDomainEvent,
}))

vi.mock('@/lib/auth/organizationAccess', () => ({
  getUserOrganizationMembership,
  syncUserLegacyRolesFromMemberships,
}))

describe('clerkWebhookSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('upserts Clerk users into the app-owned user model and emits a first-party sync event', async () => {
    const payload = {
      create: vi.fn().mockResolvedValue({
        email: 'operator@grimetime.app',
        id: 41,
      }),
      find: vi
        .fn()
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] }),
    }

    const { handleClerkWebhookEvent } = await import('@/lib/auth/clerkWebhookSync')
    const result = await handleClerkWebhookEvent({
      event: {
        data: {
          created_at: 1712620800000,
          email_addresses: [
            {
              email_address: 'operator@grimetime.app',
              id: 'email_1',
              verification: {
                status: 'verified',
              },
            },
          ],
          first_name: 'Field',
          id: 'user_123',
          last_name: 'Operator',
          primary_email_address_id: 'email_1',
          updated_at: 1712620800000,
          username: null,
        },
        event_attributes: {
          http_request: {
            client_ip: '127.0.0.1',
            user_agent: 'vitest',
          },
        },
        object: 'event',
        type: 'user.created',
      } as never,
      payload: payload as never,
    })

    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'users',
      data: expect.objectContaining({
        clerkUserID: 'user_123',
        email: 'operator@grimetime.app',
        name: 'Field Operator',
        roles: ['customer'],
      }),
      overrideAccess: true,
    }))
    expect(createAuthDomainEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'user_synced',
      sourceSystem: 'webhook',
      targetUserId: 41,
    }))
    expect(result).toEqual({
      handled: true,
      scope: 'user',
      summary: 'Synced Clerk user operator@grimetime.app.',
    })
  })

  it('reconciles membership webhooks through first-party org and membership records', async () => {
    const payload = {
      create: vi
        .fn()
        .mockResolvedValueOnce({
          clerkOrgID: 'org_123',
          id: 77,
          kind: 'customer',
          name: 'Acme Facilities',
          slug: 'acme-facilities',
          status: 'active',
        })
        .mockResolvedValueOnce({
          clerkUserID: 'user_123',
          email: 'manager@acme.test',
          id: 41,
          name: 'Acme Manager',
        })
        .mockResolvedValueOnce({
          clerkMembershipID: 'om_123',
          id: 91,
          roleTemplate: 'customer-admin',
          status: 'active',
        }),
      find: vi
        .fn()
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] }),
    }

    getUserOrganizationMembership.mockResolvedValue(null)

    const { handleClerkWebhookEvent } = await import('@/lib/auth/clerkWebhookSync')
    const result = await handleClerkWebhookEvent({
      event: {
        data: {
          created_at: 1712620800000,
          id: 'om_123',
          organization: {
            admin_delete_enabled: false,
            created_at: 1712620800000,
            has_image: false,
            id: 'org_123',
            max_allowed_memberships: 25,
            name: 'Acme Facilities',
            object: 'organization',
            public_metadata: {},
            slug: 'acme-facilities',
            updated_at: 1712620800000,
          },
          permissions: [],
          public_metadata: {},
          public_user_data: {
            first_name: 'Acme',
            has_image: false,
            identifier: 'manager@acme.test',
            image_url: '',
            last_name: 'Manager',
            user_id: 'user_123',
          },
          role: 'org:admin',
          updated_at: 1712620800000,
        },
        event_attributes: {
          http_request: {
            client_ip: '127.0.0.1',
            user_agent: 'vitest',
          },
        },
        object: 'event',
        type: 'organizationMembership.created',
      } as never,
      payload: payload as never,
    })

    expect(payload.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
      collection: 'organizations',
      overrideAccess: true,
    }))
    expect(payload.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
      collection: 'users',
      data: expect.objectContaining({
        clerkUserID: 'user_123',
        email: 'manager@acme.test',
      }),
      overrideAccess: true,
    }))
    expect(payload.create).toHaveBeenNthCalledWith(3, expect.objectContaining({
      collection: 'organization-memberships',
      data: expect.objectContaining({
        clerkMembershipID: 'om_123',
        organization: 77,
        roleTemplate: 'customer-admin',
        status: 'active',
        syncSource: 'webhook',
        user: 41,
      }),
      overrideAccess: true,
    }))
    expect(syncUserLegacyRolesFromMemberships).toHaveBeenCalledWith(payload, 41, {
      pendingMembership: expect.objectContaining({
        id: 91,
      }),
    })
    expect(createAuthDomainEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'membership_synced',
      membershipId: 91,
      organizationId: 77,
      sourceSystem: 'webhook',
      targetUserId: 41,
    }))
    expect(result).toEqual({
      handled: true,
      scope: 'membership',
      summary: 'Synced membership om_123 for manager@acme.test.',
    })
  })
})
