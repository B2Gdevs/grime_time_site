import type { Access, CollectionConfig } from 'payload'

import { beforeQuoteCrm } from '@/hooks/beforeQuoteCrm'
import { QUOTE_CRM_SYNC_STATUS_OPTIONS } from '@/lib/crm/types'
import {
  QUOTE_PROPERTY_TYPE_OPTIONS,
  QUOTE_SERVICE_TYPE_OPTIONS,
  QUOTE_STATUS_OPTIONS,
  QUOTE_TAX_CATEGORY_OPTIONS,
  QUOTE_TAX_DECISION_OPTIONS,
  QUOTE_TAX_GUIDANCE,
} from '@/lib/quotes/constants'
import { calculateLineTotal, calculateQuoteTotals } from '@/lib/quotes/calculateQuoteTotals'
import {
  applyQuoteServiceLineDefaults,
  buildQuoteTaxDecisionNotes,
  buildQuoteTitle,
} from '@/lib/quotes/normalizeQuoteDraft'
import { buildCustomerOwnershipWhere } from '@/lib/customers/access'
import { canAccessQuotes, quotesInternalEnabled } from '@/utilities/quotesAccess'

const quotesStaffAccess: Access = ({ req: { user } }) => {
  if (!quotesInternalEnabled() && !user) return false
  return Boolean(user && canAccessQuotes(user))
}

const quotesReadAccess: Access = ({ req: { user } }) => {
  if (user && canAccessQuotes(user)) return true

  const customerWhere = buildCustomerOwnershipWhere(user)
  if (!customerWhere || customerWhere === true) return customerWhere

  return {
    and: [
      customerWhere,
      {
        status: {
          in: ['sent', 'accepted'],
        },
      },
    ],
  }
}

const quotesStaffFieldAccess = ({ req: { user } }: { req: { user: unknown } }) =>
  Boolean(user && canAccessQuotes(user as Parameters<typeof canAccessQuotes>[0]))

export const Quotes: CollectionConfig = {
  slug: 'quotes',
  admin: {
    group: 'Internal',
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'customerEmail', 'pricing.total', 'updatedAt'],
    description:
      'Internal job quotes only. Includes line items, totals, and Texas tax review fields. Never expose draft quotes on the public site.',
  },
  access: {
    read: quotesReadAccess,
    create: quotesStaffAccess,
    update: quotesStaffAccess,
    delete: quotesStaffAccess,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Short label, for example: 123 Oak - house wash',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          type: 'select',
          defaultValue: 'draft',
          options: QUOTE_STATUS_OPTIONS.map((option) => ({ ...option })),
          admin: {
            width: '50%',
          },
        },
        {
          name: 'validUntil',
          type: 'date',
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
          name: 'customerName',
          type: 'text',
          admin: {
            width: '34%',
          },
        },
        {
          name: 'customerEmail',
          type: 'email',
          admin: {
            width: '33%',
          },
        },
        {
          name: 'customerPhone',
          type: 'text',
          admin: {
            width: '33%',
          },
        },
      ],
    },
    {
      name: 'customerUser',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'Attach the customer portal account so the estimate appears in their portal.',
        position: 'sidebar',
      },
    },
    {
      type: 'group',
      name: 'serviceAddress',
      admin: {
        description: 'Job site details used for scoping and local tax review.',
      },
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
          name: 'propertyType',
          type: 'select',
          defaultValue: 'residential',
          options: QUOTE_PROPERTY_TYPE_OPTIONS.map((option) => ({ ...option })),
          admin: {
            width: '40%',
          },
        },
        {
          name: 'jobSize',
          type: 'text',
          admin: {
            description: 'Sq ft, stories, linear feet, or preset label.',
            width: '60%',
          },
        },
      ],
    },
    {
      name: 'surfaceDescription',
      type: 'textarea',
      admin: {
        description: 'Surfaces: siding, concrete, roof, windows, gutters, fencing, etc.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'soilingLevel',
          type: 'select',
          options: [
            { label: 'Light', value: 'light' },
            { label: 'Medium', value: 'medium' },
            { label: 'Heavy', value: 'heavy' },
          ],
          admin: {
            width: '30%',
          },
        },
        {
          name: 'accessNotes',
          type: 'textarea',
          admin: {
            description: 'Ladder work, vegetation, HOA restrictions, hazards, water access, etc.',
            width: '70%',
          },
        },
      ],
    },
    {
      name: 'serviceLines',
      type: 'array',
      minRows: 1,
      admin: {
        description: 'Quote builder rows. Totals are calculated from these lines.',
      },
      fields: [
        {
          name: 'serviceType',
          type: 'select',
          defaultValue: 'house_wash',
          options: QUOTE_SERVICE_TYPE_OPTIONS.map((option) => ({ ...option })),
          required: true,
        },
        {
          name: 'description',
          type: 'text',
          required: true,
        },
        {
          type: 'row',
          fields: [
            {
              name: 'quantity',
              type: 'number',
              defaultValue: 1,
              required: true,
              admin: {
                step: 0.01,
                width: '25%',
              },
            },
            {
              name: 'unit',
              type: 'text',
              defaultValue: 'job',
              admin: {
                width: '25%',
              },
            },
            {
              name: 'unitPrice',
              type: 'number',
              required: true,
              admin: {
                step: 0.01,
                width: '25%',
              },
            },
            {
              name: 'lineTotal',
              type: 'number',
              admin: {
                disabled: true,
                readOnly: true,
                step: 0.01,
                width: '25%',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'taxable',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description: 'Most Texas exterior cleaning lines will stay taxable unless you have a documented exception.',
                width: '30%',
              },
            },
            {
              name: 'taxCategory',
              type: 'select',
              defaultValue: 'building_grounds_cleaning',
              options: QUOTE_TAX_CATEGORY_OPTIONS.map((option) => ({ ...option })),
              admin: {
                width: '70%',
              },
            },
          ],
        },
      ],
    },
    {
      type: 'group',
      name: 'pricing',
      admin: {
        description:
          'Calculated subtotal and tax fields. Enter the rate you plan to collect; keep exemptions and CPA-review paths documented.',
      },
      fields: [
        {
          name: 'discountAmount',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Pre-tax discount applied against the quote subtotal.',
            step: 0.01,
          },
        },
        {
          name: 'taxDecision',
          type: 'select',
          defaultValue: 'collect_sales_tax',
          options: QUOTE_TAX_DECISION_OPTIONS.map((option) => ({ ...option })),
          admin: {
            description: QUOTE_TAX_GUIDANCE,
          },
        },
        {
          name: 'taxRatePercent',
          type: 'number',
          defaultValue: 0,
          admin: {
            description:
              'Enter the actual rate you plan to collect. Texas state sales tax is 6.25%; local tax can bring the total up to 8.25% depending on your facts and filing setup.',
            step: 0.01,
          },
        },
        {
          name: 'taxDecisionNotes',
          type: 'textarea',
          admin: {
            description:
              'Document why you collected or did not collect tax, plus any homebuilder certification, exemption certificate, or CPA guidance.',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'subtotal',
              type: 'number',
              admin: {
                disabled: true,
                readOnly: true,
                step: 0.01,
                width: '25%',
              },
            },
            {
              name: 'taxableSubtotal',
              type: 'number',
              admin: {
                disabled: true,
                readOnly: true,
                step: 0.01,
                width: '25%',
              },
            },
            {
              name: 'salesTaxAmount',
              type: 'number',
              admin: {
                disabled: true,
                readOnly: true,
                step: 0.01,
                width: '25%',
              },
            },
            {
              name: 'total',
              type: 'number',
              admin: {
                disabled: true,
                readOnly: true,
                step: 0.01,
                width: '25%',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'internalNotes',
      type: 'textarea',
      admin: {
        description: 'Staff-only pricing discussion, objections, follow-up notes, and compliance flags.',
      },
    },
    {
      name: 'sourceSubmission',
      type: 'relationship',
      relationTo: 'form-submissions',
      admin: {
        position: 'sidebar',
        description: 'Optional lead form submission this quote came from.',
      },
    },
    {
      name: 'crm',
      type: 'group',
      access: {
        read: quotesStaffFieldAccess,
        update: quotesStaffFieldAccess,
      },
      admin: {
        description: 'Mirror status for the active CRM deal sync.',
        position: 'sidebar',
      },
      fields: [
        {
          name: 'provider',
          type: 'select',
          options: [
            { label: 'EngageBay', value: 'engagebay' },
            { label: 'HubSpot', value: 'hubspot' },
          ],
          admin: {
            disabled: true,
            readOnly: true,
          },
        },
        {
          name: 'dealId',
          type: 'text',
          admin: {
            disabled: true,
            readOnly: true,
          },
        },
        {
          name: 'syncStatus',
          type: 'select',
          options: QUOTE_CRM_SYNC_STATUS_OPTIONS.map((option) => ({ ...option })),
          admin: {
            disabled: true,
            readOnly: true,
          },
        },
        {
          name: 'syncedAt',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
            disabled: true,
            readOnly: true,
          },
        },
        {
          name: 'syncDetail',
          type: 'textarea',
          admin: {
            disabled: true,
            readOnly: true,
          },
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data || !Array.isArray(data.serviceLines)) return data

        const serviceLines = data.serviceLines.map((line) => ({
          ...applyQuoteServiceLineDefaults(line),
          lineTotal: calculateLineTotal(line),
        }))

        const totals = calculateQuoteTotals({
          discountAmount: data.pricing?.discountAmount,
          serviceLines,
          taxDecision: data.pricing?.taxDecision,
          taxRatePercent: data.pricing?.taxRatePercent,
        })

        return {
          ...data,
          serviceLines,
          title: buildQuoteTitle({
            ...data,
            serviceLines,
          }),
          pricing: {
            ...data.pricing,
            salesTaxAmount: totals.salesTaxAmount,
            subtotal: totals.subtotal,
            taxDecisionNotes: buildQuoteTaxDecisionNotes(data),
            taxableSubtotal: totals.taxableSubtotal,
            total: totals.total,
          },
        }
      },
    ],
    beforeChange: [beforeQuoteCrm],
  },
  timestamps: true,
}
