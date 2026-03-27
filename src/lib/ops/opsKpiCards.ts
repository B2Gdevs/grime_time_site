/**
 * Ops dashboard KPI row: defaults for info tooltips when Internal ops targets
 * global does not override copy. Keep in sync with `/ops` data loaders.
 */
export const OPS_KPI_IDS = ['leads', 'quotes', 'projectedRevenue', 'mrr'] as const
export type OpsKpiId = (typeof OPS_KPI_IDS)[number]

export const DEFAULT_OPS_KPI_TOOLTIPS: Record<OpsKpiId, string> = {
  leads: [
    'What it is: count of records in the Leads collection (first-party CRM intake).',
    'Refreshes when you load /ops. Use the CRM workspace for follow-up queues.',
  ].join('\n'),
  quotes: [
    'What it is: count of records in the Quotes collection (internal workflow).',
    'Full quote editing and opportunity review live in Payload admin.',
  ].join('\n'),
  projectedRevenue: [
    'Weighted pipeline from Payload quotes in sent or accepted status.',
    'Default weights: accepted = 100% of pricing.total; sent = 60% (editable in Internal ops targets). Not booked revenue.',
    'With no open pipeline, the card shows $0 and your target label; manual scorecard rows override when set.',
  ].join('\n'),
  mrr: [
    'Monthly recurring revenue from active service plans.',
    'Computed as sum(annualPlanAmount) ÷ 12 for plans with status active.',
    'With no active plans, the card shows $0 and your target label unless a manual MRR scorecard row is set.',
  ].join('\n'),
}

/** Prefer CMS override when set; otherwise built-in default copy. */
export function resolveOpsKpiTooltip(id: OpsKpiId, cmsOverride: string | null | undefined): string {
  const trimmed = cmsOverride?.trim()
  if (trimmed) return trimmed
  return DEFAULT_OPS_KPI_TOOLTIPS[id]
}

/** Append runtime context (counts, pipeline note) below the main tooltip body. */
export function appendTooltipSections(base: string, sections: Array<string | null | undefined>): string {
  const extra = sections.map((s) => s?.trim()).filter(Boolean) as string[]
  if (extra.length === 0) return base
  return [base, ...extra].join('\n\n')
}
