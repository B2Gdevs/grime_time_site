import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'
import { slugField } from 'payload'

import {
  canDeleteSharedSections,
  canEditSharedSectionDrafts,
  canViewSharedSectionLibrary,
  resolveSharedSectionPermissions,
} from '@/lib/auth/sharedSectionPermissions'
import {
  buildSharedSectionStructureValidationMessage,
  createDefaultSharedSectionPreview,
  createDefaultSharedSectionStructure,
  prepareSharedSectionDocumentChange,
  sharedSectionCategoryValues,
  sharedSectionPreviewStatusValues,
  sharedSectionStatusValues,
} from '@/lib/pages/sharedSections'

const syncSharedSectionDocument: CollectionBeforeChangeHook = async ({ data, operation, originalDoc, req }) => {
  const permissions = await resolveSharedSectionPermissions(req.payload, req.user)
  const userId = typeof req.user?.id === 'number' ? req.user.id : null

  const prepared = prepareSharedSectionDocumentChange({
    canChangeStatus: permissions.canPublish,
    data: (data || {}) as never,
    operation,
    originalDoc: originalDoc as never,
    userId,
  })

  return {
    ...prepared,
    tags: prepared.tags.map((tag) => ({ tag })),
  } as never
}

export const SharedSections: CollectionConfig = {
  slug: 'shared-sections',
  labels: {
    plural: 'Shared sections',
    singular: 'Shared section',
  },
  admin: {
    defaultColumns: ['name', 'category', 'status', 'currentVersion', 'usageCount', 'updatedAt'],
    description:
      'Reusable shared sections for the visual composer. These are global source records, not page-local content.',
    group: 'Content',
    useAsTitle: 'name',
  },
  access: {
    create: canEditSharedSectionDrafts,
    delete: canDeleteSharedSections,
    read: canViewSharedSectionLibrary,
    update: canEditSharedSectionDrafts,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        rows: 3,
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          type: 'select',
          defaultValue: 'content',
          options: sharedSectionCategoryValues.map((value) => ({
            label: value
              .split('-')
              .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
              .join(' '),
            value,
          })),
          required: true,
          admin: {
            width: '40%',
          },
        },
        {
          name: 'status',
          type: 'select',
          defaultValue: 'draft',
          options: sharedSectionStatusValues.map((value) => ({
            label: value.charAt(0).toUpperCase() + value.slice(1),
            value,
          })),
          required: true,
          admin: {
            description: 'Draft edits stay local to the shared source until Publish is invoked.',
            width: '30%',
          },
        },
        {
          name: 'currentVersion',
          type: 'number',
          defaultValue: 1,
          required: true,
          admin: {
            disabled: true,
            readOnly: true,
            width: '30%',
          },
        },
      ],
    },
    {
      name: 'tags',
      type: 'array',
      admin: {
        description: 'Use tags for specific business semantics such as before-after, residential, or faq.',
      },
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'usageCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        disabled: true,
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'structure',
      type: 'json',
      defaultValue: () => createDefaultSharedSectionStructure(),
      required: true,
      validate: buildSharedSectionStructureValidationMessage,
    },
    {
      name: 'preview',
      type: 'group',
      fields: [
        {
          name: 'url',
          type: 'text',
          admin: {
            disabled: true,
            readOnly: true,
            width: '50%',
          },
        },
        {
          name: 'status',
          type: 'select',
          defaultValue: 'pending',
          options: sharedSectionPreviewStatusValues.map((value) => ({
            label: value.charAt(0).toUpperCase() + value.slice(1),
            value,
          })),
          required: true,
          admin: {
            disabled: true,
            readOnly: true,
            width: '25%',
          },
        },
        {
          name: 'updatedAt',
          type: 'date',
          admin: {
            disabled: true,
            readOnly: true,
            width: '25%',
          },
        },
        {
          name: 'errorMessage',
          type: 'textarea',
          admin: {
            disabled: true,
            readOnly: true,
            rows: 2,
          },
        },
      ],
      defaultValue: () => createDefaultSharedSectionPreview(),
    },
    {
      type: 'row',
      fields: [
        {
          name: 'createdBy',
          type: 'relationship',
          relationTo: 'users',
          admin: {
            disabled: true,
            readOnly: true,
            width: '25%',
          },
        },
        {
          name: 'updatedBy',
          type: 'relationship',
          relationTo: 'users',
          admin: {
            disabled: true,
            readOnly: true,
            width: '25%',
          },
        },
        {
          name: 'publishedAt',
          type: 'date',
          admin: {
            disabled: true,
            readOnly: true,
            width: '25%',
          },
        },
        {
          name: 'archivedAt',
          type: 'date',
          admin: {
            disabled: true,
            readOnly: true,
            width: '25%',
          },
        },
      ],
    },
    slugField({
      fieldToUse: 'name',
    }),
  ],
  hooks: {
    beforeChange: [syncSharedSectionDocument],
  },
  timestamps: true,
  versions: {
    drafts: true,
    maxPerDoc: 50,
  },
}
