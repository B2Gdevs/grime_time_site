import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'

export const GrowthMilestones: CollectionConfig = {
  slug: 'growth-milestones',
  labels: { plural: 'Growth milestones', singular: 'Growth milestone' },
  admin: {
    group: 'Internal',
    defaultColumns: ['title', 'sortOrder', 'updatedAt'],
    useAsTitle: 'title',
    description: 'Growth ladder rows shown on /ops (edit in admin).',
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
    },
    {
      name: 'trigger',
      type: 'textarea',
      admin: { description: 'Volume or stage trigger (e.g. jobs per month).' },
    },
    {
      name: 'winCondition',
      type: 'textarea',
      admin: { description: 'Operating standard to unlock the next stage.' },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Lower numbers appear first on the portal.' },
    },
  ],
}
