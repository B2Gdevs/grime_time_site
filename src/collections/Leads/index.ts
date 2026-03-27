import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { afterLeadAutomation } from '@/hooks/afterLeadAutomation'
import {
  CRM_LEAD_SOURCE_OPTIONS,
  CRM_LEAD_STATUS_OPTIONS,
  CRM_PRIORITY_OPTIONS,
  CRM_TEMPERATURE_OPTIONS,
} from '@/lib/crm/schema'

export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: { plural: 'Leads', singular: 'Lead' },
  admin: {
    group: 'CRM',
    defaultColumns: ['title', 'status', 'priority', 'source', 'owner', 'updatedAt'],
    useAsTitle: 'title',
    description: 'Inbound lead records before qualification and account/contact conversion.',
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
          defaultValue: 'new',
          options: CRM_LEAD_STATUS_OPTIONS.map((option) => ({ ...option })),
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
          name: 'source',
          type: 'select',
          required: true,
          defaultValue: 'manual',
          options: CRM_LEAD_SOURCE_OPTIONS.map((option) => ({ ...option })),
          admin: { width: '25%' },
        },
        {
          name: 'temperature',
          type: 'select',
          defaultValue: 'warm',
          options: CRM_TEMPERATURE_OPTIONS.map((option) => ({ ...option })),
          admin: { width: '25%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'customerName',
          type: 'text',
          required: true,
          admin: { width: '34%' },
        },
        {
          name: 'customerEmail',
          type: 'email',
          admin: { width: '33%' },
        },
        {
          name: 'customerPhone',
          type: 'text',
          admin: { width: '33%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'owner',
          type: 'relationship',
          relationTo: 'users',
          admin: { width: '34%' },
        },
        {
          name: 'nextActionAt',
          type: 'date',
          admin: { width: '33%' },
        },
        {
          name: 'staleAt',
          type: 'date',
          admin: { width: '33%' },
        },
      ],
    },
    {
      name: 'serviceAddress',
      type: 'group',
      fields: [
        { name: 'street1', type: 'text' },
        { name: 'street2', type: 'text' },
        {
          type: 'row',
          fields: [
            { name: 'city', type: 'text', admin: { width: '40%' } },
            { name: 'state', type: 'text', defaultValue: 'TX', admin: { width: '20%' } },
            { name: 'postalCode', type: 'text', admin: { width: '40%' } },
          ],
        },
      ],
    },
    {
      name: 'serviceSummary',
      type: 'textarea',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'relatedQuote',
          type: 'relationship',
          relationTo: 'quotes',
          admin: { width: '34%' },
        },
        {
          name: 'account',
          type: 'relationship',
          relationTo: 'accounts',
          admin: { width: '33%' },
        },
        {
          name: 'contact',
          type: 'relationship',
          relationTo: 'contacts',
          admin: { width: '33%' },
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
  hooks: {
    afterChange: [afterLeadAutomation],
  },
  timestamps: true,
}
