import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import {
  billingEventSourceOptions,
  billingEventTypeOptions,
  invoicePaymentSourceOptions,
} from '@/lib/billing/constants'

export const BillingEvents: CollectionConfig = {
  slug: 'billing-events',
  labels: { plural: 'Billing events', singular: 'Billing event' },
  admin: {
    group: 'Billing',
    defaultColumns: ['eventType', 'occurredAt', 'account', 'invoice', 'sourceSystem'],
    useAsTitle: 'eventLabel',
    description: 'Audit trail for Stripe webhooks, manual payment records, credits, refunds, and billing adjustments.',
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      name: 'eventLabel',
      type: 'text',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'eventType',
          type: 'select',
          required: true,
          options: billingEventTypeOptions.map((option) => ({ ...option })),
          admin: {
            width: '34%',
          },
        },
        {
          name: 'sourceSystem',
          type: 'select',
          required: true,
          defaultValue: 'internal',
          options: billingEventSourceOptions.map((option) => ({ ...option })),
          admin: {
            width: '33%',
          },
        },
        {
          name: 'occurredAt',
          type: 'date',
          required: true,
          defaultValue: () => new Date().toISOString(),
          admin: {
            width: '33%',
          },
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
          admin: {
            width: '25%',
          },
        },
        {
          name: 'invoice',
          type: 'relationship',
          relationTo: 'invoices',
          admin: {
            width: '25%',
          },
        },
        {
          name: 'servicePlan',
          type: 'relationship',
          relationTo: 'service-plans',
          admin: {
            width: '25%',
          },
        },
        {
          name: 'serviceAppointment',
          type: 'relationship',
          relationTo: 'service-appointments',
          admin: {
            width: '25%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'customerUser',
          type: 'relationship',
          relationTo: 'users',
          admin: {
            width: '34%',
          },
        },
        {
          name: 'actor',
          type: 'relationship',
          relationTo: 'users',
          admin: {
            description: 'Admin or system actor responsible for the event.',
            width: '33%',
          },
        },
        {
          name: 'paymentSource',
          type: 'select',
          options: invoicePaymentSourceOptions.map((option) => ({ ...option })),
          admin: {
            width: '33%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'amount',
          type: 'number',
          min: 0,
          admin: {
            step: 0.01,
            width: '34%',
          },
        },
        {
          name: 'currency',
          type: 'text',
          defaultValue: 'usd',
          admin: {
            width: '16%',
          },
        },
        {
          name: 'paymentReference',
          type: 'text',
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'stripeEventID',
          type: 'text',
          unique: true,
          admin: {
            width: '34%',
          },
        },
        {
          name: 'stripeObjectID',
          type: 'text',
          admin: {
            width: '33%',
          },
        },
        {
          name: 'processedAt',
          type: 'date',
          admin: {
            width: '33%',
          },
        },
      ],
    },
    {
      name: 'reason',
      type: 'textarea',
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'payloadSnapshot',
      type: 'json',
    },
  ],
  timestamps: true,
}
