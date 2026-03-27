import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'

/**
 * Customer quotes for marketing. Public reads only see `published` docs.
 * Use the **Testimonials** layout block on a page when you are ready to display them.
 */
export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  labels: { plural: 'Testimonials', singular: 'Testimonial' },
  admin: {
    group: 'Content',
    defaultColumns: ['authorName', 'published', 'featured', 'updatedAt'],
    useAsTitle: 'authorName',
    description:
      'Published testimonials can be shown via the Testimonials block on Pages. Leave unpublished or omit the block until you want them live.',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: ({ req: { user } }) => {
      if (user) return true
      return { published: { equals: true } }
    },
    update: authenticated,
  },
  fields: [
    {
      name: 'quote',
      type: 'textarea',
      required: true,
      admin: { rows: 5 },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'authorName',
          type: 'text',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'authorDetail',
          type: 'text',
          admin: {
            width: '50%',
            description: 'Optional — e.g. neighborhood, property type.',
          },
        },
      ],
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'rating',
      type: 'number',
      min: 1,
      max: 5,
      admin: { description: 'Optional 1–5 stars.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'published',
          type: 'checkbox',
          defaultValue: false,
          admin: { width: '33%' },
        },
        {
          name: 'featured',
          type: 'checkbox',
          defaultValue: false,
          admin: { width: '33%' },
        },
        {
          name: 'sortOrder',
          type: 'number',
          defaultValue: 0,
          admin: { width: '34%', description: 'Lower sorts first when using “featured + latest”.' },
        },
      ],
    },
  ],
  timestamps: true,
}
