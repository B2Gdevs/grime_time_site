import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import {
  inboundMediaIngestionProviderOptions,
  inboundMediaIngestionStatusOptions,
} from '@/lib/media/inboundMediaIngestion'

export const InboundMediaIngestions: CollectionConfig = {
  slug: 'inbound-media-ingestions',
  labels: {
    plural: 'Inbound media ingestions',
    singular: 'Inbound media ingestion',
  },
  admin: {
    group: 'Media',
    useAsTitle: 'ingestionLabel',
    description:
      'Admin-only audit trail for inbound media deliveries before attachments become first-party media records.',
    defaultColumns: ['ingestionLabel', 'status', 'provider', 'receivedAt', 'senderEmail'],
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      name: 'ingestionLabel',
      type: 'text',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          type: 'select',
          defaultValue: 'received',
          options: inboundMediaIngestionStatusOptions.map((option) => ({ ...option })),
          required: true,
          admin: {
            width: '34%',
          },
        },
        {
          name: 'provider',
          type: 'select',
          defaultValue: 'other',
          options: inboundMediaIngestionProviderOptions.map((option) => ({ ...option })),
          required: true,
          admin: {
            width: '33%',
          },
        },
        {
          name: 'receivedAt',
          type: 'date',
          defaultValue: () => new Date().toISOString(),
          required: true,
          admin: {
            width: '33%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'providerEventID',
          type: 'text',
          unique: true,
          admin: {
            width: '34%',
          },
        },
        {
          name: 'providerMessageID',
          type: 'text',
          admin: {
            width: '33%',
          },
        },
        {
          name: 'idempotencyKey',
          type: 'text',
          unique: true,
          required: true,
          admin: {
            width: '33%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'senderEmail',
          type: 'text',
          admin: {
            width: '34%',
          },
        },
        {
          name: 'senderName',
          type: 'text',
          admin: {
            width: '33%',
          },
        },
        {
          name: 'recipientEmail',
          type: 'text',
          admin: {
            width: '33%',
          },
        },
      ],
    },
    {
      name: 'subject',
      type: 'text',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'replayCount',
          type: 'number',
          defaultValue: 0,
          min: 0,
          required: true,
          admin: {
            width: '20%',
          },
        },
        {
          name: 'replayRequestedAt',
          type: 'date',
          admin: {
            width: '40%',
          },
        },
        {
          name: 'processedAt',
          type: 'date',
          admin: {
            width: '40%',
          },
        },
      ],
    },
    {
      name: 'attachmentAudit',
      type: 'json',
      admin: {
        description:
          'Attachment-level audit rows. Future adapters can populate these before or after individual media records are created.',
      },
    },
    {
      name: 'createdMediaIDs',
      type: 'json',
      admin: {
        description:
          'Media record ids created from this ingestion once the provider adapter promotes accepted attachments into the main library.',
      },
    },
    {
      name: 'latestError',
      type: 'textarea',
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'payloadSnapshot',
      type: 'json',
    },
  ],
  timestamps: true,
}
