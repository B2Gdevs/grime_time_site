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
      name: 'quoteProjectionWeightAccepted',
      type: 'number',
      defaultValue: 1,
      min: 0,
      max: 1,
      admin: {
        description:
          'Weight applied to accepted-quote dollar amounts in the weighted pipeline (KPI + chart). 1 = 100%.',
        step: 0.05,
      },
    },
    {
      name: 'quoteProjectionWeightSent',
      type: 'number',
      defaultValue: 0.6,
      min: 0,
      max: 1,
      admin: {
        description: 'Weight applied to sent-quote dollar amounts in the weighted pipeline (e.g. 0.6 = 60%).',
        step: 0.05,
      },
    },
    {
      name: 'projectedRevenueDisplay',
      type: 'text',
      defaultValue: '$13.6k',
      admin: {
        description:
          'Target label for the projected revenue KPI when there is no open weighted pipeline (shown next to $0, not as fake pipeline dollars).',
      },
    },
    {
      name: 'mrrTargetDisplay',
      type: 'text',
      defaultValue: '$1.8k',
      admin: {
        description:
          'Target label for the MRR KPI when no active recurring plans exist (shown next to $0, not as fake MRR).',
      },
    },
    {
      name: 'chartDisclaimer',
      type: 'textarea',
      defaultValue:
        'Illustrative sample trend for layout only. Connect real accounting and first-party CRM data in a later phase.',
      admin: {
        description: 'Shown under the business momentum chart on /ops.',
      },
    },
    {
      name: 'chartPipelineNote',
      type: 'textarea',
      admin: {
        description:
          'Extra line under the chart when live internal pipeline context is shown (for example how weighted quote totals are computed).',
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
          'Optional tooltips for scorecard tab rows. KPI name must match the scorecard label exactly (for example Revenue or MRR).',
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
