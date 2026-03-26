import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import {
  CRM_OPPORTUNITY_STAGE_OPTIONS,
  CRM_OPPORTUNITY_STATUS_OPTIONS,
  CRM_PRIORITY_OPTIONS,
} from '@/lib/crm/schema'

export const Opportunities: CollectionConfig = {
  slug: 'opportunities',
  labels: { plural: 'Opportunities', singular: 'Opportunity' },
  admin: {
    group: 'CRM',
    defaultColumns: ['title', 'stage', 'status', 'value', 'owner', 'expectedCloseDate'],
    useAsTitle: 'title',
    description: 'Pipeline records linked to quotes, accounts, contacts, and follow-up work.',
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'open',
          options: CRM_OPPORTUNITY_STATUS_OPTIONS.map((option) => ({ ...option })),
          admin: { width: '25%' },
        },
        {
          name: 'stage',
          type: 'select',
          required: true,
          defaultValue: 'new_lead',
          options: CRM_OPPORTUNITY_STAGE_OPTIONS.map((option) => ({ ...option })),
          admin: { width: '25%' },
        },
        {
          name: 'priority',
          type: 'select',
          required: true,
          defaultValue: 'medium',
          options: CRM_PRIORITY_OPTIONS.map((option) => ({ ...option })),
          admin: { width: '25%' },
        },
        {
          name: 'owner',
          type: 'relationship',
          relationTo: 'users',
          admin: { width: '25%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'value',
          type: 'number',
          min: 0,
          admin: { step: 0.01, width: '34%' },
        },
        {
          name: 'expectedCloseDate',
          type: 'date',
          admin: { width: '33%' },
        },
        {
          name: 'lastActivityAt',
          type: 'date',
          admin: { width: '33%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'lead',
          type: 'relationship',
          relationTo: 'leads',
          admin: { width: '25%' },
        },
        {
          name: 'account',
          type: 'relationship',
          relationTo: 'accounts',
          admin: { width: '25%' },
        },
        {
          name: 'contact',
          type: 'relationship',
          relationTo: 'contacts',
          admin: { width: '25%' },
        },
        {
          name: 'quote',
          type: 'relationship',
          relationTo: 'quotes',
          admin: { width: '25%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'nextAction',
          type: 'text',
          admin: { width: '60%' },
        },
        {
          name: 'nextActionAt',
          type: 'date',
          admin: { width: '40%' },
        },
      ],
    },
    {
      name: 'closeReason',
      type: 'textarea',
      admin: {
        condition: (_, siblingData) => siblingData?.status === 'lost',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
  timestamps: true,
}
