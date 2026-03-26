import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import {
  CRM_PRIORITY_OPTIONS,
  CRM_SEQUENCE_AUDIENCE_OPTIONS,
  CRM_SEQUENCE_DEFINITION_STATUS_OPTIONS,
  CRM_SEQUENCE_DELAY_UNIT_OPTIONS,
  CRM_SEQUENCE_STEP_TYPE_OPTIONS,
  CRM_SEQUENCE_TRIGGER_OPTIONS,
  CRM_TASK_TYPE_OPTIONS,
} from '@/lib/crm/schema'

export const CrmSequences: CollectionConfig = {
  slug: 'crm-sequences',
  labels: { plural: 'CRM sequences', singular: 'CRM sequence' },
  admin: {
    group: 'CRM',
    defaultColumns: ['name', 'status', 'audience', 'trigger', 'updatedAt'],
    useAsTitle: 'name',
    description: 'In-app sequence builder for follow-up automation, task creation, and Resend delivery.',
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'key',
          type: 'text',
          required: true,
          unique: true,
          admin: {
            description: 'Stable internal key for jobs and enrollment logic.',
            width: '34%',
          },
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'draft',
          options: CRM_SEQUENCE_DEFINITION_STATUS_OPTIONS.map((option) => ({ ...option })),
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
          name: 'audience',
          type: 'select',
          required: true,
          defaultValue: 'lead',
          options: CRM_SEQUENCE_AUDIENCE_OPTIONS.map((option) => ({ ...option })),
          admin: { width: '50%' },
        },
        {
          name: 'trigger',
          type: 'select',
          required: true,
          defaultValue: 'manual',
          options: CRM_SEQUENCE_TRIGGER_OPTIONS.map((option) => ({ ...option })),
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'settings',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'businessDaysOnly',
              type: 'checkbox',
              defaultValue: true,
              admin: { width: '25%' },
            },
            {
              name: 'stopOnReply',
              type: 'checkbox',
              defaultValue: true,
              admin: { width: '25%' },
            },
            {
              name: 'stopOnBooking',
              type: 'checkbox',
              defaultValue: true,
              admin: { width: '25%' },
            },
            {
              name: 'stopOnPayment',
              type: 'checkbox',
              defaultValue: true,
              admin: { width: '25%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'sendWindowStartHour',
              type: 'number',
              min: 0,
              max: 23,
              defaultValue: 8,
              admin: { width: '50%' },
            },
            {
              name: 'sendWindowEndHour',
              type: 'number',
              min: 0,
              max: 23,
              defaultValue: 18,
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
    {
      name: 'steps',
      type: 'array',
      minRows: 1,
      labels: { plural: 'Steps', singular: 'Step' },
      admin: {
        description: 'Ordered steps for the sequence builder. Keep each step compact and explicit.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'stepType',
              type: 'select',
              required: true,
              defaultValue: 'wait',
              options: CRM_SEQUENCE_STEP_TYPE_OPTIONS.map((option) => ({ ...option })),
              admin: { width: '34%' },
            },
            {
              name: 'delayAmount',
              type: 'number',
              min: 0,
              defaultValue: 0,
              admin: { width: '33%' },
            },
            {
              name: 'delayUnit',
              type: 'select',
              defaultValue: 'days',
              options: CRM_SEQUENCE_DELAY_UNIT_OPTIONS.map((option) => ({ ...option })),
              admin: { width: '33%' },
            },
          ],
        },
        {
          name: 'emailTemplateKey',
          type: 'text',
          admin: {
            condition: (_, siblingData) => siblingData?.stepType === 'send_email',
            description: 'Template identifier used by Resend delivery code.',
          },
        },
        {
          name: 'emailSubject',
          type: 'text',
          admin: {
            condition: (_, siblingData) => siblingData?.stepType === 'send_email',
          },
        },
        {
          name: 'taskTitle',
          type: 'text',
          admin: {
            condition: (_, siblingData) => siblingData?.stepType === 'create_task',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'taskType',
              type: 'select',
              options: CRM_TASK_TYPE_OPTIONS.map((option) => ({ ...option })),
              admin: {
                condition: (_, siblingData) => siblingData?.stepType === 'create_task',
                width: '50%',
              },
            },
            {
              name: 'taskPriority',
              type: 'select',
              options: CRM_PRIORITY_OPTIONS.map((option) => ({ ...option })),
              defaultValue: 'medium',
              admin: {
                condition: (_, siblingData) => siblingData?.stepType === 'create_task',
                width: '50%',
              },
            },
          ],
        },
        {
          name: 'internalNotes',
          type: 'textarea',
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
