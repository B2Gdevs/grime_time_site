import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'

export const OpsLiabilityItems: CollectionConfig = {
  slug: 'ops-liability-items',
  labels: { plural: 'Ops liability items', singular: 'Ops liability item' },
  admin: {
    group: 'Internal',
    defaultColumns: ['label', 'sortOrder', 'updatedAt'],
    useAsTitle: 'label',
    description: 'Liability / drag items shown on /ops scorecard tab.',
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: { description: 'Optional detail shown in the portal sheet.' },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Lower numbers appear first.' },
    },
  ],
}
