import type { GlobalConfig } from 'payload'

/** Admin-only targets and copy for the internal `/ops` dashboard. */
export const InternalOpsSettings: GlobalConfig = {
  slug: 'internalOpsSettings',
  label: 'Internal ops targets',
  admin: {
    group: 'Internal',
    description: 'Revenue targets and chart copy for the ops command center (portal).',
  },
  access: {
    read: ({ req: { user } }) =>
      Boolean(user && 'roles' in user && user.roles?.includes('admin')),
    update: ({ req: { user } }) =>
      Boolean(user && 'roles' in user && user.roles?.includes('admin')),
  },
  fields: [
    {
      name: 'annualRevenueGoal',
      type: 'number',
      min: 0,
      defaultValue: 250000,
      admin: {
        description: 'Annual revenue goal in USD (reference for planning; cards use display fields below).',
      },
    },
    {
      name: 'projectedRevenueDisplay',
      type: 'text',
      defaultValue: '$13.6k',
      admin: {
        description: 'Value shown on the “Projected revenue” KPI card (e.g. weighted pipeline target).',
      },
    },
    {
      name: 'mrrTargetDisplay',
      type: 'text',
      defaultValue: '$1.8k',
      admin: {
        description: 'Value shown on the “MRR” KPI card.',
      },
    },
    {
      name: 'chartDisclaimer',
      type: 'textarea',
      defaultValue:
        'Illustrative sample trend for layout only — connect real accounting or CRM data in a later phase.',
      admin: {
        description: 'Shown under the business momentum chart on /ops.',
      },
    },
    {
      name: 'chartPipelineNote',
      type: 'textarea',
      admin: {
        description:
          'Extra line under the chart when HubSpot pipeline is shown (e.g. how open deal totals are computed).',
      },
    },
    {
      name: 'kpiTooltipLeads',
      type: 'textarea',
      admin: { description: 'Help text for the Leads KPI card (info icon on /ops).' },
    },
    {
      name: 'kpiTooltipQuotes',
      type: 'textarea',
      admin: { description: 'Help text for the Quotes KPI card.' },
    },
    {
      name: 'kpiTooltipProjectedRevenue',
      type: 'textarea',
      admin: { description: 'Help text for the Projected revenue KPI card.' },
    },
    {
      name: 'kpiTooltipMrr',
      type: 'textarea',
      admin: { description: 'Help text for the MRR KPI card.' },
    },
    {
      name: 'scorecardKpiTooltips',
      type: 'array',
      admin: {
        description:
          'Optional tooltips for scorecard tab rows. KPI name must match the scorecard label exactly (e.g. Revenue, MRR).',
      },
      fields: [
        {
          name: 'kpiName',
          type: 'text',
          required: true,
        },
        {
          name: 'helpText',
          type: 'textarea',
          required: true,
        },
      ],
    },
  ],
}
