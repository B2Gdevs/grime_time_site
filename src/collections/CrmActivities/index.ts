import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { CRM_ACTIVITY_DIRECTION_OPTIONS, CRM_ACTIVITY_TYPE_OPTIONS } from '@/lib/crm/schema'

export const CrmActivities: CollectionConfig = {
  slug: 'crm-activities',
  labels: { plural: 'CRM activities', singular: 'CRM activity' },
  admin: {
    group: 'CRM',
    defaultColumns: ['title', 'activityType', 'direction', 'owner', 'occurredAt'],
    useAsTitle: 'title',
    description: 'Timeline events for notes, calls, emails, tasks, and system automation.',
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
          name: 'activityType',
          type: 'select',
          required: true,
          defaultValue: 'note',
          options: CRM_ACTIVITY_TYPE_OPTIONS.map((option) => ({ ...option })),
          admin: { width: '34%' },
        },
        {
          name: 'direction',
          type: 'select',
          required: true,
          defaultValue: 'internal',
          options: CRM_ACTIVITY_DIRECTION_OPTIONS.map((option) => ({ ...option })),
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
      name: 'occurredAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'body',
      type: 'textarea',
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
          name: 'opportunity',
          type: 'relationship',
          relationTo: 'opportunities',
          admin: { width: '25%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'relatedTask',
          type: 'relationship',
          relationTo: 'crm-tasks',
          admin: { width: '25%' },
        },
        {
          name: 'quote',
          type: 'relationship',
          relationTo: 'quotes',
          admin: { width: '25%' },
        },
        {
          name: 'invoice',
          type: 'relationship',
          relationTo: 'invoices',
          admin: { width: '25%' },
        },
        {
          name: 'servicePlan',
          type: 'relationship',
          relationTo: 'service-plans',
          admin: { width: '25%' },
        },
      ],
    },
  ],
  timestamps: true,
}
