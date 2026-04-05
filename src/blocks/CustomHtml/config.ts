import type { Block } from 'payload'

import { blockVisibilityField } from '@/blocks/shared/blockVisibilityField'

export const CustomHtml: Block = {
  slug: 'customHtml',
  interfaceName: 'CustomHtmlBlock',
  labels: {
    plural: 'Custom HTML blocks',
    singular: 'Custom HTML block',
  },
  fields: [
    {
      name: 'label',
      type: 'text',
    },
    {
      name: 'html',
      type: 'textarea',
      required: true,
    },
    blockVisibilityField,
  ],
}
