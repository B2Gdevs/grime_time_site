import type { Block } from 'payload'

import { blockVisibilityField } from '@/blocks/shared/blockVisibilityField'
import { heroFields } from '@/heros/config'

export const HeroBlock: Block = {
  slug: 'heroBlock',
  interfaceName: 'HeroBlock',
  labels: {
    singular: 'Hero',
    plural: 'Heroes',
  },
  fields: [
    ...heroFields,
    blockVisibilityField,
  ],
}
