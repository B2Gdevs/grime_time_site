import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { CRM_PRIORITY_OPTIONS, CRM_TASK_STATUS_OPTIONS, CRM_TASK_TYPE_OPTIONS } from '@/lib/crm/schema'

export const CrmTasks: CollectionConfig = {
  slug: 'crm-tasks',
  labels: { plural: 'CRM tasks', singular: 'CRM task' },
  admin: {
    group: 'CRM',
    defaultColumns: ['title', 'status', 'priority', 'taskType', 'owner', 'dueAt'],
    useAsTitle: 'title',
    description: 'Follow-up tasks for leads, opportunities, billing, and schedule coordination.',
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
          options: CRM_TASK_STATUS_OPTIONS.map((option) => ({ ...option })),
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
          name: 'taskType',
          type: 'select',
          required: true,
          defaultValue: 'general',
          options: CRM_TASK_TYPE_OPTIONS.map((option) => ({ ...option })),
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
          name: 'dueAt',
          type: 'date',
          required: true,
          admin: { width: '34%' },
        },
        {
          name: 'completedAt',
          type: 'date',
          admin: { width: '33%' },
        },
        {
          name: 'staleAt',
          type: 'date',
          admin: {
            description: 'If present and before now, the task should show as stale in the queue.',
            width: '33%',
          },
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
        {
          name: 'serviceAppointment',
          type: 'relationship',
          relationTo: 'service-appointments',
          admin: { width: '25%' },
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
