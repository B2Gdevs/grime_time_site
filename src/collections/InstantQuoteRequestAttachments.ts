import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { INSTANT_QUOTE_ATTACHMENT_ACCEPTED_MIME_PREFIXES } from '@/lib/forms/instantQuoteAttachments'

export const InstantQuoteRequestAttachments: CollectionConfig = {
  slug: 'instant-quote-request-attachments',
  labels: {
    plural: 'Instant quote attachments',
    singular: 'Instant quote attachment',
  },
  admin: {
    group: 'Leads',
    useAsTitle: 'customerFilename',
    description:
      'Internal estimator photos linked to form submissions and later quote review. These files are not part of the public media library.',
    defaultColumns: ['customerFilename', 'attachmentStatus', 'submission', 'createdAt'],
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  upload: {
    adminThumbnail: 'thumbnail',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 320,
      },
    ],
    mimeTypes: [...INSTANT_QUOTE_ATTACHMENT_ACCEPTED_MIME_PREFIXES],
  },
  fields: [
    {
      name: 'submission',
      type: 'relationship',
      relationTo: 'form-submissions',
      required: true,
      admin: {
        description: 'The instant-quote form submission that created this attachment.',
      },
    },
    {
      name: 'quote',
      type: 'relationship',
      relationTo: 'quotes',
      admin: {
        description: 'Optional quote linked later during staff review.',
      },
    },
    {
      name: 'attachmentStatus',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Reviewed', value: 'reviewed' },
        { label: 'Linked to quote', value: 'linked_to_quote' },
      ],
      required: true,
    },
    {
      name: 'intakeSource',
      type: 'select',
      defaultValue: 'instant_quote',
      options: [{ label: 'Instant quote', value: 'instant_quote' }],
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'customerFilename',
          type: 'text',
          required: true,
        },
        {
          name: 'contentType',
          type: 'text',
          required: true,
        },
        {
          name: 'fileSizeBytes',
          type: 'number',
          required: true,
          min: 0,
        },
      ],
    },
    {
      name: 'reviewNotes',
      type: 'textarea',
    },
  ],
}
