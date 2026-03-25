import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'

export const OpsScorecardRows: CollectionConfig = {
  slug: 'ops-scorecard-rows',
  labels: { plural: 'Ops scorecard rows', singular: 'Ops scorecard row' },
  admin: {
    group: 'Internal',
    defaultColumns: ['title', 'sortOrder', 'updatedAt'],
    useAsTitle: 'title',
    description:
      'KPI definitions for /ops. Title should match the built-in KPI name (e.g. Revenue, MRR) to override defaults.',
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
      admin: {
        description: 'Must match scorecard KPI label exactly when overriding defaults.',
      },
    },
    {
      name: 'formula',
      type: 'textarea',
      required: true,
    },
    {
      name: 'targetGuidance',
      type: 'textarea',
      admin: { description: 'Target / operating standard text.' },
    },
    {
      name: 'manualValue',
      type: 'number',
      admin: { description: 'Optional scalar staff can track (displayed on /ops card grid).' },
    },
    {
      name: 'manualValueLabel',
      type: 'text',
      admin: { description: 'Label for manual value (e.g. Target hours).' },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
    },
  ],
}
