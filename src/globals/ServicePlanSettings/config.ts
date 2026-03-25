import type { GlobalConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'

export const ServicePlanSettings: GlobalConfig = {
  slug: 'servicePlanSettings',
  label: 'Service plan settings',
  admin: {
    group: 'Internal',
    description:
      'Draft and publish the default subscription terms used when Grime Time sells recurring maintenance plans.',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    readVersions: isAdmin,
    update: isAdmin,
  },
  versions: {
    drafts: {
      autosave: {
        interval: 1200,
        showSaveDraftButton: true,
      },
      schedulePublish: true,
      validate: true,
    },
    max: 25,
  },
  fields: [
    {
      name: 'minimumVisitsPerYear',
      type: 'number',
      required: true,
      min: 1,
      defaultValue: 2,
      admin: {
        description: 'Default annual visit count for recurring plans.',
      },
    },
    {
      name: 'discountPercentOffSingleJob',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
      defaultValue: 20,
      admin: {
        description: 'Default discount applied to each visit relative to a one-off single-job quote.',
      },
    },
    {
      name: 'billingInstallmentsPerYear',
      type: 'number',
      required: true,
      min: 1,
      defaultValue: 12,
      admin: {
        description: 'How many installments the annual plan total is split into by default.',
      },
    },
    {
      name: 'defaultCadenceMonths',
      type: 'number',
      required: true,
      min: 1,
      defaultValue: 6,
      admin: {
        description: 'Default spacing in months between recurring visits.',
      },
    },
    {
      name: 'customerSummary',
      type: 'textarea',
      defaultValue:
        'Recurring plans default to two visits per year at a 20% discount from normal one-off pricing, billed in equal installments across the year.',
      admin: {
        description: 'Short summary shown to customers in the portal.',
      },
    },
  ],
}
