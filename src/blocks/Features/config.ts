import type { Block } from 'payload'

import { blockVisibilityField } from '@/blocks/shared/blockVisibilityField'

export const Features: Block = {
  slug: 'features',
  interfaceName: 'FeaturesBlock',
  labels: {
    singular: 'Features',
    plural: 'Features',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
    },
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Why customers choose us',
      required: true,
    },
    {
      name: 'intro',
      type: 'textarea',
    },
    {
      name: 'features',
      type: 'array',
      minRows: 1,
      labels: {
        singular: 'Feature',
        plural: 'Features',
      },
      fields: [
        {
          name: 'eyebrow',
          type: 'text',
        },
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'summary',
          type: 'textarea',
          required: true,
        },
      ],
    },
    blockVisibilityField,
  ],
}
