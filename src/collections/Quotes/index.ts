import type { Access, CollectionConfig } from 'payload'

import { canAccessQuotes, quotesInternalEnabled } from '@/utilities/quotesAccess'

const quotesStaffAccess: Access = ({ req: { user } }) => {
  if (!quotesInternalEnabled()) return false
  return Boolean(user && canAccessQuotes(user.email))
}

export const Quotes: CollectionConfig = {
  slug: 'quotes',
  admin: {
    group: 'Internal',
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'customerEmail', 'updatedAt'],
    description:
      'Internal job quotes only — not exposed on the public site. Enable with QUOTES_INTERNAL_ENABLED and QUOTES_INTERNAL_EMAILS.',
  },
  access: {
    read: quotesStaffAccess,
    create: quotesStaffAccess,
    update: quotesStaffAccess,
    delete: quotesStaffAccess,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { description: 'Short label, e.g. “123 Oak — house wash”' },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Sent', value: 'sent' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Lost', value: 'lost' },
      ],
    },
    {
      name: 'customerName',
      type: 'text',
    },
    {
      name: 'customerEmail',
      type: 'email',
    },
    {
      name: 'customerPhone',
      type: 'text',
    },
    {
      name: 'jobSize',
      type: 'text',
      admin: { description: 'Sq ft, stories, linear feet, or preset label' },
    },
    {
      name: 'surfaceDescription',
      type: 'textarea',
      admin: { description: 'Surfaces: siding, concrete, roof, windows, etc.' },
    },
    {
      name: 'soilingLevel',
      type: 'select',
      options: [
        { label: 'Light', value: 'light' },
        { label: 'Medium', value: 'medium' },
        { label: 'Heavy', value: 'heavy' },
      ],
    },
    {
      name: 'accessNotes',
      type: 'textarea',
      admin: { description: 'Ladder work, vegetation, HOA, hazards' },
    },
    {
      name: 'internalNotes',
      type: 'textarea',
      admin: { description: 'Staff-only — pricing discussion, CPA/tax flags, etc.' },
    },
    {
      name: 'sourceSubmission',
      type: 'relationship',
      relationTo: 'form-submissions',
      admin: {
        position: 'sidebar',
        description: 'Optional: lead form submission this quote came from.',
      },
    },
  ],
  timestamps: true,
}
