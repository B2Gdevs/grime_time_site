import type {
  CollectionBeforeValidateHook,
  CollectionConfig,
} from 'payload'

import { USERS_COLLECTION_SLUG } from '@/collections/Users'
import { canManageMemberships } from '@/lib/auth/organizationAccess'
import {
  ORGANIZATION_MEMBERSHIPS_COLLECTION_SLUG,
  ORGANIZATIONS_COLLECTION_SLUG,
} from '@/lib/auth/organizationConstants'
import { numericRelationId, relationId } from '@/lib/crm/internal/relationship'
import { ORGANIZATION_MEMBERSHIP_ROLE_OPTIONS } from '@/lib/auth/organizationRoles'

const ensureUniqueOrganizationMembership: CollectionBeforeValidateHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data) {
    return data
  }

  const organizationId = numericRelationId(data.organization)
  const userId = numericRelationId(data.user)

  if (organizationId == null || userId == null) {
    return data
  }

  const duplicates = await req.payload.find({
    collection: ORGANIZATION_MEMBERSHIPS_COLLECTION_SLUG,
    depth: 0,
    limit: 2,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      and: [
        {
          organization: {
            equals: organizationId,
          },
        },
        {
          user: {
            equals: userId,
          },
        },
      ],
    },
  })

  const originalId = relationId(originalDoc as { id?: null | number | string } | null | undefined)
  const conflictingDoc = duplicates.docs.find((doc) => relationId(doc) !== originalId)

  if (conflictingDoc && (operation === 'create' || relationId(conflictingDoc) !== originalId)) {
    throw new Error('This user already has a membership for that organization.')
  }

  return data
}

export const OrganizationMemberships: CollectionConfig = {
  slug: ORGANIZATION_MEMBERSHIPS_COLLECTION_SLUG,
  access: {
    create: canManageMemberships,
    delete: canManageMemberships,
    read: canManageMemberships,
    update: canManageMemberships,
  },
  admin: {
    defaultColumns: ['organization', 'user', 'roleTemplate', 'status', 'syncSource'],
  },
  fields: [
    {
      name: 'organization',
      type: 'relationship',
      index: true,
      relationTo: ORGANIZATIONS_COLLECTION_SLUG,
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      index: true,
      relationTo: USERS_COLLECTION_SLUG,
      required: true,
    },
    {
      name: 'roleTemplate',
      type: 'select',
      defaultValue: 'customer-member',
      options: ORGANIZATION_MEMBERSHIP_ROLE_OPTIONS.map((option) => ({ ...option })),
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Revoked', value: 'revoked' },
      ],
      required: true,
    },
    {
      name: 'syncSource',
      type: 'select',
      defaultValue: 'app',
      options: [
        { label: 'Application', value: 'app' },
        { label: 'Clerk', value: 'clerk' },
        { label: 'Webhook', value: 'webhook' },
        { label: 'Bootstrap', value: 'bootstrap' },
      ],
      required: true,
    },
    {
      name: 'clerkMembershipID',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
      index: true,
      unique: true,
    },
    {
      name: 'lastSyncedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    beforeValidate: [ensureUniqueOrganizationMembership],
  },
}
