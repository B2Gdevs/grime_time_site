import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'

export const OpsAssetLadderItems: CollectionConfig = {
  slug: 'ops-asset-ladder-items',
  labels: { plural: 'Ops asset ladder items', singular: 'Ops asset ladder item' },
  admin: {
    group: 'Internal',
    defaultColumns: ['label', 'owned', 'sortOrder', 'updatedAt'],
    useAsTitle: 'label',
    description: 'Equipment ladder on /ops. Unchecked = want; checked = have.',
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
      admin: { description: 'Stage or category name.' },
    },
    {
      name: 'buyNotes',
      type: 'textarea',
      admin: { description: 'What to buy or spec.' },
    },
    {
      name: 'whyNotes',
      type: 'textarea',
      admin: { description: 'Why it matters / bottleneck it removes.' },
    },
    {
      name: 'owned',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Checked = you have it. Unchecked = on the wishlist.',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Lower numbers appear first on the portal.' },
    },
  ],
}
