import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import {
  CRM_CONTACT_ROLE_OPTIONS,
  CRM_CONTACT_STATUS_OPTIONS,
  CRM_PREFERRED_CONTACT_METHOD_OPTIONS,
} from '@/lib/crm/schema'

export const Contacts: CollectionConfig = {
  slug: 'contacts',
  labels: { plural: 'Contacts', singular: 'Contact' },
  admin: {
    group: 'CRM',
    defaultColumns: ['fullName', 'email', 'status', 'owner', 'account', 'updatedAt'],
    useAsTitle: 'fullName',
    description: 'People records linked to accounts, opportunities, and customer users.',
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      name: 'fullName',
      type: 'text',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'email',
          type: 'email',
          required: true,
          admin: { width: '34%' },
        },
        {
          name: 'phone',
          type: 'text',
          admin: { width: '33%' },
        },
        {
          name: 'owner',
          type: 'relationship',
          relationTo: 'users',
          admin: { width: '33%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'active',
          options: CRM_CONTACT_STATUS_OPTIONS.map((option) => ({ ...option })),
          admin: { width: '34%' },
        },
        {
          name: 'roles',
          type: 'select',
          hasMany: true,
          options: CRM_CONTACT_ROLE_OPTIONS.map((option) => ({ ...option })),
          admin: { width: '33%' },
        },
        {
          name: 'preferredContactMethod',
          type: 'select',
          defaultValue: 'any',
          options: CRM_PREFERRED_CONTACT_METHOD_OPTIONS.map((option) => ({ ...option })),
          admin: { width: '33%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'account',
          type: 'relationship',
          relationTo: 'accounts',
          admin: { width: '34%' },
        },
        {
          name: 'linkedUser',
          type: 'relationship',
          relationTo: 'users',
          admin: { width: '33%' },
        },
        {
          name: 'lastContactAt',
          type: 'date',
          admin: { width: '33%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'nextActionAt',
          type: 'date',
          admin: { width: '50%' },
        },
        {
          name: 'staleAt',
          type: 'date',
          admin: {
            description: 'Date when this contact should appear stale in follow-up queues.',
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
  timestamps: true,
}
