import type { Block } from 'payload'

import { blockVisibilityField } from '@/blocks/shared/blockVisibilityField'

/**
 * Renders the first-party contact form → `/api/lead-forms/contact`.
 * Use this instead of a generic Form block so submissions stay on the CRM lead path.
 */
export const ContactRequest: Block = {
  slug: 'contactRequest',
  interfaceName: 'ContactRequestBlock',
  fields: [
    {
      name: 'layoutVariant',
      type: 'select',
      defaultValue: 'default',
      options: [{ label: 'Default', value: 'default' }],
      admin: {
        description: 'Layout options for this block may expand later; the site currently uses the default shell.',
      },
    },
    blockVisibilityField,
  ],
  labels: {
    plural: 'Contact request (first-party)',
    singular: 'Contact request (first-party)',
  },
}
