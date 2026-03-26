import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { createAssignCustomerAccountHook } from '@/lib/customers/accountRelationship'
import { buildCustomerOwnershipWhere } from '@/lib/customers/access'
import { billingDocumentStatusOptions } from '@/lib/services/constants'

export const Invoices: CollectionConfig = {
  slug: 'invoices',
  labels: { plural: 'Invoices', singular: 'Invoice' },
  admin: {
    group: 'Customer ops',
    defaultColumns: ['invoiceNumber', 'title', 'status', 'customerEmail', 'balanceDue', 'dueDate'],
    useAsTitle: 'title',
    description: 'Customer-facing invoices that appear in the portal.',
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: ({ req: { user } }) => buildCustomerOwnershipWhere(user),
    update: isAdmin,
  },
  fields: [
    {
      name: 'invoiceNumber',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'account',
      type: 'relationship',
      relationTo: 'accounts',
      admin: {
        description: 'Portal company or household account associated with this invoice.',
        position: 'sidebar',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'open',
          options: billingDocumentStatusOptions.map((option) => ({ ...option })),
          admin: {
            width: '34%',
          },
        },
        {
          name: 'issueDate',
          type: 'date',
          admin: {
            width: '33%',
          },
        },
        {
          name: 'dueDate',
          type: 'date',
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
          name: 'customerUser',
          type: 'relationship',
          relationTo: 'users',
          admin: {
            width: '34%',
          },
        },
        {
          name: 'customerEmail',
          type: 'email',
          required: true,
          admin: {
            width: '33%',
          },
        },
        {
          name: 'customerName',
          type: 'text',
          admin: {
            width: '33%',
          },
        },
      ],
    },
    {
      name: 'serviceAddress',
      type: 'group',
      fields: [
        {
          name: 'street1',
          type: 'text',
        },
        {
          name: 'street2',
          type: 'text',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'city',
              type: 'text',
              admin: {
                width: '40%',
              },
            },
            {
              name: 'state',
              type: 'text',
              defaultValue: 'TX',
              admin: {
                width: '20%',
              },
            },
            {
              name: 'postalCode',
              type: 'text',
              admin: {
                width: '40%',
              },
            },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'total',
          type: 'number',
          required: true,
          min: 0,
          admin: {
            step: 0.01,
            width: '33%',
          },
        },
        {
          name: 'balanceDue',
          type: 'number',
          required: true,
          min: 0,
          admin: {
            step: 0.01,
            width: '33%',
          },
        },
        {
          name: 'paymentUrl',
          type: 'text',
          admin: {
            description: 'Optional hosted invoice / payment URL.',
            width: '34%',
          },
        },
      ],
    },
    {
      name: 'lineItems',
      type: 'array',
      labels: { plural: 'Line items', singular: 'Line item' },
      fields: [
        {
          name: 'description',
          type: 'text',
          required: true,
        },
        {
          name: 'amount',
          type: 'number',
          required: true,
          min: 0,
          admin: {
            step: 0.01,
          },
        },
      ],
    },
    {
      name: 'relatedQuote',
      type: 'relationship',
      relationTo: 'quotes',
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
  hooks: {
    beforeValidate: [createAssignCustomerAccountHook()],
  },
}
