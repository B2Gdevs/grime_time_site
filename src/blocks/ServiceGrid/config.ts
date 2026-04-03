import type { Block } from 'payload'

import { serviceGridDisplayVariantOptions } from './variants'

export const ServiceGrid: Block = {
  slug: 'serviceGrid',
  interfaceName: 'ServiceGridBlock',
  labels: {
    singular: 'Service grid',
    plural: 'Service grids',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'Our services',
    },
    {
      name: 'intro',
      type: 'textarea',
    },
    {
      name: 'displayVariant',
      type: 'select',
      defaultValue: 'interactive',
      options: serviceGridDisplayVariantOptions.map((option) => ({
        label: option.label,
        value: option.value,
      })),
      admin: {
        description: 'Choose the public section treatment for this block.',
      },
    },
    {
      name: 'services',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Service', plural: 'Services' },
      fields: [
        {
          name: 'eyebrow',
          type: 'text',
        },
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'summary',
          type: 'textarea',
          required: true,
        },
        {
          name: 'media',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'pricingHint',
          type: 'text',
        },
        {
          name: 'highlights',
          type: 'array',
          labels: {
            singular: 'Highlight',
            plural: 'Highlights',
          },
          maxRows: 3,
          fields: [
            {
              name: 'text',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
