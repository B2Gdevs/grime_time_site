import type { CollectionConfig } from 'payload'

import { canManageOrganizations } from '@/lib/auth/organizationAccess'
import { ORGANIZATIONS_COLLECTION_SLUG } from '@/lib/auth/organizationConstants'
import {
  ORGANIZATION_KIND_OPTIONS,
  ORGANIZATION_PROVIDER_OPTIONS,
} from '@/lib/auth/organizationRoles'

export const Organizations: CollectionConfig = {
  slug: ORGANIZATIONS_COLLECTION_SLUG,
  access: {
    create: canManageOrganizations,
    delete: canManageOrganizations,
    read: canManageOrganizations,
    update: canManageOrganizations,
  },
  admin: {
    defaultColumns: ['name', 'slug', 'kind', 'status', 'provider', 'clerkOrgID'],
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      index: true,
      required: true,
      unique: true,
    },
    {
      name: 'kind',
      type: 'select',
      defaultValue: 'customer',
      options: ORGANIZATION_KIND_OPTIONS.map((option) => ({ ...option })),
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Locked', value: 'locked' },
        { label: 'Disabled', value: 'disabled' },
      ],
      required: true,
    },
    {
      name: 'provider',
      type: 'select',
      defaultValue: 'app',
      options: ORGANIZATION_PROVIDER_OPTIONS.map((option) => ({ ...option })),
      required: true,
    },
    {
      name: 'clerkOrgID',
      type: 'text',
      admin: {
        description: 'External Clerk organization mapping for mirrored auth/provider sync.',
        position: 'sidebar',
      },
      index: true,
      unique: true,
    },
    {
      name: 'syncSource',
      type: 'select',
      defaultValue: 'app',
      options: [
        { label: 'Application', value: 'app' },
        { label: 'Clerk', value: 'clerk' },
        { label: 'Webhook', value: 'webhook' },
      ],
      required: true,
    },
    {
      name: 'lastSyncedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
