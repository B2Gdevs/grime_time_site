import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'

export const OpsAssetLadderItems: CollectionConfig = {
  slug: 'ops-asset-ladder-items',
  labels: { plural: 'Ops assets', singular: 'Ops asset' },
  admin: {
    group: 'Internal',
    defaultColumns: ['label', 'owned', 'sortOrder', 'updatedAt'],
    useAsTitle: 'label',
    description: 'Asset inventory used by Ops workspace. Checked = have; unchecked = planned / want.',
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
      admin: { description: 'Asset name shown in Ops workspace.' },
    },
    {
      name: 'buyNotes',
      type: 'textarea',
      admin: { description: 'Spec, setup, or purchase details.' },
    },
    {
      name: 'whyNotes',
      type: 'textarea',
      admin: { description: 'Ops notes, usage notes, or why this asset matters.' },
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
