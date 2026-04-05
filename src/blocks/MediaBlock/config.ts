import type { Block } from 'payload'

import { blockVisibilityField } from '@/blocks/shared/blockVisibilityField'
import { composerReusableField } from '@/blocks/shared/composerReusableField'

export const MediaBlock: Block = {
  slug: 'mediaBlock',
  interfaceName: 'MediaBlock',
  fields: [
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    composerReusableField,
    blockVisibilityField,
  ],
}
