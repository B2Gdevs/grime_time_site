import type { GlobalConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { revalidateQuoteSettings } from './hooks/revalidateQuoteSettings'

const serviceKeyOptions = [
  { label: 'House wash', value: 'house_wash' },
  { label: 'Driveway and flatwork', value: 'driveway' },
  { label: 'Porch or patio refresh', value: 'porch_patio' },
  { label: 'Dock cleaning', value: 'dock' },
  { label: 'Dumpster pad and grease area', value: 'dumpster_pad' },
]

export const QuoteSettings: GlobalConfig = {
  slug: 'quoteSettings',
  label: 'Quote settings',
  admin: {
    group: 'Internal',
    description:
      'Draft and publish the service toggles, rates, and multipliers that power the public instant quote experience.',
  },
  access: {
    read: isAdmin,
    readVersions: isAdmin,
    update: isAdmin,
  },
  versions: {
    drafts: {
      autosave: {
        interval: 1200,
        showSaveDraftButton: true,
      },
      schedulePublish: true,
      validate: true,
    },
    max: 50,
  },
  fields: [
    {
      name: 'services',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { plural: 'Services', singular: 'Service' },
      admin: {
        description:
          'These rows drive the instant quote cards, labels, and live estimate math. Turn services on/off without code.',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'serviceKey',
          type: 'select',
          required: true,
          options: serviceKeyOptions,
        },
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
        },
        {
          name: 'recommendedFor',
          type: 'textarea',
          required: true,
        },
        {
          type: 'row',
          fields: [
            {
              name: 'minimum',
              type: 'number',
              min: 0,
              required: true,
            },
            {
              name: 'sqftLowRate',
              type: 'number',
              min: 0,
              required: true,
            },
            {
              name: 'sqftHighRate',
              type: 'number',
              min: 0,
              required: true,
            },
            {
              name: 'sortOrder',
              type: 'number',
              defaultValue: 0,
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'enabledOnSite',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'quoteEnabled',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'frequencyEligible',
              type: 'checkbox',
              defaultValue: true,
            },
          ],
        },
      ],
    },
    {
      name: 'conditionMultipliers',
      type: 'group',
      admin: {
        description: 'How job condition changes the estimate range.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'light',
              type: 'number',
              required: true,
              defaultValue: 0.94,
            },
            {
              name: 'standard',
              type: 'number',
              required: true,
              defaultValue: 1,
            },
            {
              name: 'heavy',
              type: 'number',
              required: true,
              defaultValue: 1.22,
            },
          ],
        },
      ],
    },
    {
      name: 'storyMultipliers',
      type: 'group',
      admin: {
        description: 'How home height changes the estimate range.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'oneStory',
              type: 'number',
              required: true,
              defaultValue: 1,
            },
            {
              name: 'twoStories',
              type: 'number',
              required: true,
              defaultValue: 1.14,
            },
            {
              name: 'threePlusStories',
              type: 'number',
              required: true,
              defaultValue: 1.3,
            },
          ],
        },
      ],
    },
    {
      name: 'frequencyMultipliers',
      type: 'group',
      admin: {
        description: 'Discount multipliers for recurring maintenance plans.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'oneTime',
              type: 'number',
              required: true,
              defaultValue: 1,
            },
            {
              name: 'biannual',
              type: 'number',
              required: true,
              defaultValue: 0.96,
            },
            {
              name: 'quarterly',
              type: 'number',
              required: true,
              defaultValue: 0.9,
            },
          ],
        },
      ],
    },
    {
      name: 'houseWashPricing',
      type: 'group',
      admin: {
        description:
          'House washes now calibrate from exterior wall count rather than square footage for the public estimator.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'oneStoryPerWall',
              type: 'number',
              required: true,
              defaultValue: 100,
            },
            {
              name: 'twoStoryPerWall',
              type: 'number',
              required: true,
              defaultValue: 150,
            },
            {
              name: 'minimumWalls',
              type: 'number',
              required: true,
              defaultValue: 4,
              min: 1,
            },
          ],
        },
        {
          name: 'manualReviewNote',
          type: 'textarea',
          required: true,
          defaultValue:
            'Three-story and taller homes move to a staff-reviewed quote. Photo review confirms access, setup, and safety before we lock scope.',
        },
      ],
    },
    {
      name: 'estimatorMessaging',
      type: 'group',
      admin: {
        description:
          'Shared public estimator copy so the homepage promise stays aligned with the current pricing model.',
      },
      fields: [
        {
          name: 'estimateDisclaimer',
          type: 'textarea',
          required: true,
          defaultValue:
            'Instant quotes are starting guidance. Final scope is confirmed after we review surface condition, access, and any photos you send.',
        },
        {
          name: 'waterAccessNote',
          type: 'textarea',
          required: true,
          defaultValue:
            'Standard pricing assumes customer-supplied water is available on site. Low-water properties may need a hauling review.',
        },
        {
          name: 'drivewayPhotoNote',
          type: 'textarea',
          required: true,
          defaultValue:
            'Residential flatwork estimates move faster when we can review both the driveway and the connecting sidewalk.',
        },
        {
          name: 'commercialExpansionNote',
          type: 'textarea',
          required: true,
          defaultValue:
            'Larger commercial flatwork, parking lots, fences, and building packages stay staff-reviewed until the expanded equipment lane is live.',
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateQuoteSettings],
  },
}
