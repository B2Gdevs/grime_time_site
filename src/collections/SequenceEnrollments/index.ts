import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { CRM_SEQUENCE_STATUS_OPTIONS } from '@/lib/crm/schema'

export const SequenceEnrollments: CollectionConfig = {
  slug: 'sequence-enrollments',
  labels: { plural: 'Sequence enrollments', singular: 'Sequence enrollment' },
  admin: {
    group: 'CRM',
    defaultColumns: ['title', 'sequenceKey', 'status', 'stepIndex', 'nextRunAt', 'updatedAt'],
    useAsTitle: 'title',
    description: 'Automation enrollments for Payload jobs and Resend-driven follow-up sequences.',
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
          name: 'sequenceKey',
          type: 'text',
          required: true,
          admin: { width: '34%' },
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'queued',
          options: CRM_SEQUENCE_STATUS_OPTIONS.map((option) => ({ ...option })),
          admin: { width: '33%' },
        },
        {
          name: 'stepIndex',
          type: 'number',
          required: true,
          defaultValue: 0,
          min: 0,
          admin: { width: '33%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'nextRunAt',
          type: 'date',
          admin: { width: '34%' },
        },
        {
          name: 'lastRunAt',
          type: 'date',
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
          name: 'sequenceDefinition',
          type: 'relationship',
          relationTo: 'crm-sequences',
          admin: { width: '25%' },
        },
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
      ],
    },
    {
      name: 'opportunity',
      type: 'relationship',
      relationTo: 'opportunities',
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
          name: 'serviceAppointment',
          type: 'relationship',
          relationTo: 'service-appointments',
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
    {
      name: 'lastError',
      type: 'textarea',
    },
    {
      name: 'exitReason',
      type: 'textarea',
    },
  ],
  timestamps: true,
}
