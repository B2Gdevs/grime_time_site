import type { Field } from 'payload'

export const composerReusableField: Field = {
  name: 'composerReusable',
  type: 'group',
  admin: {
    condition: () => false,
  },
  fields: [
    {
      dbName: 'src_type',
      enumName: 'cmp_reuse_src_type',
      name: 'sourceType',
      type: 'select',
      options: [
        {
          label: 'Preset',
          value: 'preset',
        },
        {
          label: 'Shared section',
          value: 'shared-section',
        },
      ],
    },
    {
      dbName: 'reuse_mode',
      enumName: 'cmp_reuse_mode',
      name: 'mode',
      type: 'select',
      options: [
        {
          label: 'Linked',
          value: 'linked',
        },
        {
          label: 'Detached',
          value: 'detached',
        },
      ],
    },
    {
      name: 'key',
      type: 'text',
    },
    {
      name: 'label',
      type: 'text',
    },
    {
      name: 'sharedSectionId',
      type: 'number',
    },
    {
      name: 'syncedVersion',
      type: 'number',
    },
  ],
}
