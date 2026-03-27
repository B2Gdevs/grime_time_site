import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { invoiceCollectionMethodOptions, servicePlanBillingModeOptions } from '@/lib/billing/constants'
import { createAssignCustomerAccountHook } from '@/lib/customers/accountRelationship'
import { buildCustomerOwnershipWhere } from '@/lib/customers/access'
import { arrivalWindowOptions, servicePlanStatusOptions } from '@/lib/services/constants'
import { calculateServicePlanPricing } from '@/lib/services/subscriptionMath'

export const ServicePlans: CollectionConfig = {
  slug: 'service-plans',
  labels: { plural: 'Service plans', singular: 'Service plan' },
  admin: {
    group: 'Customer ops',
    defaultColumns: ['title', 'status', 'customerEmail', 'annualPlanAmount', 'visitsPerYear'],
    useAsTitle: 'title',
    description: 'Recurring maintenance-plan records used by the customer portal and scheduling views.',
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
        description: 'Portal company or household account associated with this recurring plan.',
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
          defaultValue: 'active',
          options: servicePlanStatusOptions.map((option) => ({ ...option })),
          admin: {
            width: '34%',
          },
        },
        {
          name: 'anchorDate',
          type: 'date',
          admin: {
            description: 'First visit or anchor date used to suggest the ongoing cadence.',
            width: '33%',
          },
        },
        {
          name: 'preferredWindow',
          type: 'select',
          defaultValue: 'flexible',
          options: arrivalWindowOptions.map((option) => ({ ...option })),
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
      name: 'sourceQuote',
      type: 'relationship',
      relationTo: 'quotes',
      admin: {
        description: 'Accepted quote this plan was built from.',
      },
    },
    {
      name: 'serviceSummary',
      type: 'textarea',
      admin: {
        description: 'Short service scope summary shown in the portal.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'singleJobAmount',
          type: 'number',
          required: true,
          min: 0,
          admin: {
            description: 'Reference price for one normal standalone visit.',
            step: 0.01,
            width: '25%',
          },
        },
        {
          name: 'discountPercent',
          type: 'number',
          required: true,
          min: 0,
          max: 100,
          defaultValue: 20,
          admin: {
            step: 0.01,
            width: '25%',
          },
        },
        {
          name: 'visitsPerYear',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 2,
          admin: {
            width: '25%',
          },
        },
        {
          name: 'billingInstallmentsPerYear',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 12,
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
          name: 'discountedVisitAmount',
          type: 'number',
          admin: {
            disabled: true,
            readOnly: true,
            step: 0.01,
            width: '25%',
          },
        },
        {
          name: 'annualPlanAmount',
          type: 'number',
          admin: {
            disabled: true,
            readOnly: true,
            step: 0.01,
            width: '25%',
          },
        },
        {
          name: 'installmentAmount',
          type: 'number',
          admin: {
            disabled: true,
            readOnly: true,
            step: 0.01,
            width: '25%',
          },
        },
        {
          name: 'cadenceMonths',
          type: 'number',
          admin: {
            disabled: true,
            readOnly: true,
            width: '25%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'billingMode',
          type: 'select',
          defaultValue: 'autopay_subscription',
          options: servicePlanBillingModeOptions.map((option) => ({ ...option })),
          admin: {
            width: '25%',
          },
        },
        {
          name: 'collectionMethod',
          type: 'select',
          defaultValue: 'charge_automatically',
          options: invoiceCollectionMethodOptions.map((option) => ({ ...option })),
          admin: {
            width: '25%',
          },
        },
        {
          name: 'billingTermsDays',
          type: 'number',
          min: 0,
          defaultValue: 0,
          admin: {
            width: '25%',
          },
        },
        {
          name: 'autoRenew',
          type: 'checkbox',
          defaultValue: true,
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
          name: 'paymentMethodRequired',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            width: '25%',
          },
        },
        {
          name: 'stripeCustomerID',
          type: 'text',
          admin: {
            readOnly: true,
            width: '25%',
          },
        },
        {
          name: 'stripeSubscriptionID',
          type: 'text',
          admin: {
            readOnly: true,
            width: '25%',
          },
        },
        {
          name: 'stripeSubscriptionStatus',
          type: 'text',
          admin: {
            readOnly: true,
            width: '25%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'currentPeriodStart',
          type: 'date',
          admin: {
            readOnly: true,
            width: '33%',
          },
        },
        {
          name: 'currentPeriodEnd',
          type: 'date',
          admin: {
            readOnly: true,
            width: '33%',
          },
        },
        {
          name: 'nextInvoiceAt',
          type: 'date',
          admin: {
            readOnly: true,
            width: '34%',
          },
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
  hooks: {
    beforeValidate: [
      createAssignCustomerAccountHook(),
      ({ data }) => {
        if (!data) return data

        const pricing = calculateServicePlanPricing({
          billingInstallmentsPerYear: data.billingInstallmentsPerYear,
          discountPercent: data.discountPercent,
          singleJobAmount: data.singleJobAmount,
          visitsPerYear: data.visitsPerYear,
        })

        return {
          ...data,
          annualPlanAmount: pricing.annualPlanAmount,
          cadenceMonths: pricing.cadenceMonths,
          discountedVisitAmount: pricing.discountedVisitAmount,
          installmentAmount: pricing.installmentAmount,
          title:
            typeof data.title === 'string' && data.title.trim().length > 0
              ? data.title
              : `${data.customerName || data.customerEmail || 'Customer'} plan`,
        }
      },
    ],
  },
}
