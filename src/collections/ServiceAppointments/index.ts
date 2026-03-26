import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { createAssignCustomerAccountHook } from '@/lib/customers/accountRelationship'
import { buildCustomerOwnershipWhere } from '@/lib/customers/access'
import { arrivalWindowOptions, serviceAppointmentStatusOptions } from '@/lib/services/constants'

export const ServiceAppointments: CollectionConfig = {
  slug: 'service-appointments',
  labels: { plural: 'Service appointments', singular: 'Service appointment' },
  admin: {
    group: 'Customer ops',
    defaultColumns: ['title', 'status', 'customerEmail', 'scheduledStart', 'arrivalWindow'],
    useAsTitle: 'title',
    description: 'Scheduled or requested customer jobs shown in the portal and ops calendar.',
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: ({ req: { user } }) => buildCustomerOwnershipWhere(user),
    update: isAdmin,
  },
  fields: [
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
        description: 'Portal company or household account associated with this appointment.',
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
          defaultValue: 'requested',
          options: serviceAppointmentStatusOptions.map((option) => ({ ...option })),
          admin: {
            width: '34%',
          },
        },
        {
          name: 'arrivalWindow',
          type: 'select',
          defaultValue: 'flexible',
          options: arrivalWindowOptions.map((option) => ({ ...option })),
          admin: {
            width: '33%',
          },
        },
        {
          name: 'requestSource',
          type: 'select',
          defaultValue: 'portal',
          options: [
            { label: 'Portal', value: 'portal' },
            { label: 'Admin', value: 'admin' },
            { label: 'Phone', value: 'phone' },
            { label: 'Recurring plan', value: 'subscription_auto' },
          ],
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
          required: true,
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
          name: 'requestedDate',
          type: 'date',
          admin: {
            description: 'Customer-requested date before the team confirms the slot.',
            width: '34%',
          },
        },
        {
          name: 'scheduledStart',
          type: 'date',
          admin: {
            width: '33%',
          },
        },
        {
          name: 'scheduledEnd',
          type: 'date',
          admin: {
            width: '33%',
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
      name: 'servicePlan',
      type: 'relationship',
      relationTo: 'service-plans',
    },
    {
      name: 'customerNotes',
      type: 'textarea',
    },
    {
      name: 'internalNotes',
      type: 'textarea',
    },
  ],
  hooks: {
    beforeValidate: [createAssignCustomerAccountHook()],
  },
}
