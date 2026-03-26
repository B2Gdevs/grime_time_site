import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import {
  CRM_ACCOUNT_BILLING_TERMS_OPTIONS,
  CRM_ACCOUNT_STATUS_OPTIONS,
  CRM_ACCOUNT_TYPE_OPTIONS,
} from '@/lib/crm/schema'

export const Accounts: CollectionConfig = {
  slug: 'accounts',
  labels: { plural: 'Accounts', singular: 'Account' },
  admin: {
    group: 'CRM',
    defaultColumns: ['name', 'status', 'accountType', 'owner', 'updatedAt'],
    useAsTitle: 'name',
    description: 'Household or business relationship record for the first-party CRM.',
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
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'prospect',
          options: CRM_ACCOUNT_STATUS_OPTIONS.map((option) => ({ ...option })),
          admin: { width: '34%' },
        },
        {
          name: 'accountType',
          type: 'select',
          required: true,
          defaultValue: 'residential',
          options: CRM_ACCOUNT_TYPE_OPTIONS.map((option) => ({ ...option })),
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
          name: 'legalName',
          type: 'text',
          admin: { width: '34%' },
        },
        {
          name: 'primaryContact',
          type: 'relationship',
          relationTo: 'contacts',
          admin: { width: '33%' },
        },
        {
          name: 'customerUser',
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
          name: 'billingEmail',
          type: 'email',
          admin: { width: '34%' },
        },
        {
          name: 'accountsPayableEmail',
          type: 'email',
          admin: {
            condition: (_, siblingData) => siblingData?.accountType !== 'residential',
            width: '33%',
          },
        },
        {
          name: 'accountsPayablePhone',
          type: 'text',
          admin: {
            condition: (_, siblingData) => siblingData?.accountType !== 'residential',
            width: '33%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'billingTerms',
          type: 'select',
          defaultValue: 'due_on_receipt',
          options: CRM_ACCOUNT_BILLING_TERMS_OPTIONS.map((option) => ({ ...option })),
          admin: {
            condition: (_, siblingData) => siblingData?.accountType !== 'residential',
            width: '34%',
          },
        },
        {
          name: 'locationCount',
          type: 'number',
          min: 1,
          defaultValue: 1,
          admin: {
            condition: (_, siblingData) => siblingData?.accountType !== 'residential',
            width: '33%',
          },
        },
        {
          name: 'taxExempt',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            condition: (_, siblingData) => siblingData?.accountType !== 'residential',
            width: '33%',
          },
        },
      ],
    },
    {
      name: 'taxExemptionReference',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.taxExempt === true,
        description: 'Certificate number, internal note, or exemption reference for commercial billing.',
      },
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
      name: 'billingAddress',
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
      name: 'serviceLocationSummary',
      type: 'textarea',
      admin: {
        condition: (_, siblingData) => siblingData?.accountType !== 'residential',
        description: 'Useful for multi-site commercial relationships or route notes.',
      },
    },
    {
      name: 'activeQuote',
      type: 'relationship',
      relationTo: 'quotes',
    },
    {
      name: 'activeServicePlan',
      type: 'relationship',
      relationTo: 'service-plans',
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
  timestamps: true,
}
