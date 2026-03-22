import type { Field } from 'payload'

import { link } from '@/fields/link'

/** One column in the pricing table (global or inline on a page). */
export const pricingPlanFields: Field[] = [
  {
    name: 'name',
    type: 'text',
    required: true,
    admin: { description: 'Package name, e.g. “Driveway refresh”' },
  },
  {
    name: 'tagline',
    type: 'text',
    admin: { description: 'Short subtitle under the name' },
  },
  {
    name: 'price',
    type: 'text',
    required: true,
    admin: { description: 'Display price, e.g. $199, From $149, Call for quote' },
  },
  {
    name: 'priceNote',
    type: 'text',
    admin: { description: 'Fine print: per visit, typical home size, etc.' },
  },
  {
    name: 'highlighted',
    type: 'checkbox',
    label: 'Featured column (emphasized)',
    defaultValue: false,
  },
  {
    name: 'features',
    type: 'array',
    minRows: 1,
    labels: { singular: 'Feature', plural: 'Features' },
    fields: [
      {
        name: 'text',
        type: 'text',
        required: true,
      },
    ],
  },
  link({
    appearances: ['default', 'outline'],
    overrides: {
      label: 'Call to action',
    },
  }),
]
