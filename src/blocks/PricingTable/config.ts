import type { Block } from 'payload'

import { pricingPlanFields } from '@/fields/pricingPlan'

export const PricingTable: Block = {
  slug: 'pricingTable',
  interfaceName: 'PricingTableBlock',
  labels: {
    singular: 'Pricing table',
    plural: 'Pricing tables',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      admin: {
        description:
          'Optional title for this section. If empty, uses the global “Pricing & packages” title when source is global.',
      },
    },
    {
      name: 'dataSource',
      type: 'radio',
      defaultValue: 'global',
      options: [
        {
          label: 'Global plans (edit under Globals → Pricing & packages)',
          value: 'global',
        },
        {
          label: 'Plans only on this page',
          value: 'inline',
        },
      ],
    },
    {
      name: 'inlinePlans',
      type: 'array',
      labels: { singular: 'Plan', plural: 'Plans' },
      admin: {
        condition: (_, siblingData) => siblingData?.dataSource === 'inline',
        initCollapsed: true,
      },
      fields: pricingPlanFields,
    },
  ],
}
