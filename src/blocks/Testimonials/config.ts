import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

/**
 * Renders selected published testimonials. If none are selected, the block renders nothing
 * (safe to add before you have content).
 */
export const TestimonialsBlock: Block = {
  slug: 'testimonialsBlock',
  interfaceName: 'TestimonialsSectionBlock',
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: 'Heading',
    },
    {
      name: 'intro',
      type: 'richText',
      label: 'Intro',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
    },
    {
      name: 'selectionMode',
      type: 'select',
      defaultValue: 'selected',
      options: [
        { label: 'Choose specific testimonials', value: 'selected' },
        { label: 'Latest published (sort order)', value: 'featuredLatest' },
      ],
    },
    {
      name: 'testimonials',
      type: 'relationship',
      relationTo: 'testimonials' as never,
      hasMany: true,
      maxRows: 12,
      admin: {
        description: 'Used when selection mode is “Choose specific”.',
        condition: (_, siblingData) => siblingData?.selectionMode === 'selected',
      },
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 6,
      min: 1,
      max: 24,
      admin: {
        description: 'Used for “Latest published”.',
        condition: (_, siblingData) => siblingData?.selectionMode === 'featuredLatest',
      },
    },
  ],
  labels: {
    plural: 'Testimonials sections',
    singular: 'Testimonials section',
  },
}
