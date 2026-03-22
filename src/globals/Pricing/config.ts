import type { GlobalConfig } from 'payload'

import { pricingPlanFields } from '@/fields/pricingPlan'
import { revalidatePricing } from './hooks/revalidatePricing'

export const Pricing: GlobalConfig = {
  slug: 'pricing',
  label: 'Pricing & packages',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Site',
    description: 'Packages shown when a page uses the “Pricing table” block with “Use global pricing”.',
  },
  fields: [
    {
      name: 'sectionTitle',
      type: 'text',
      defaultValue: 'Packages & pricing',
    },
    {
      name: 'sectionIntro',
      type: 'textarea',
      admin: {
        description: 'Optional intro under the title (plain text).',
      },
    },
    {
      name: 'plans',
      type: 'array',
      labels: { singular: 'Plan', plural: 'Plans' },
      admin: {
        initCollapsed: true,
      },
      fields: pricingPlanFields,
    },
  ],
  hooks: {
    afterChange: [revalidatePricing],
  },
}
