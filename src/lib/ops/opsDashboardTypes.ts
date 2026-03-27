/** Serializable growth milestone row for /ops (from Payload). */
export type OpsGrowthMilestoneRow = {
  id: string
  title: string
  trigger?: string | null
  winCondition?: string | null
  sortOrder?: number | null
}

/** Serializable asset ladder row for /ops (from Payload). */
export type OpsAssetLadderRow = {
  id: string
  label: string
  buyNotes?: string | null
  whyNotes?: string | null
  owned?: boolean | null
  sortOrder?: number | null
}

/** Liability row from Payload `ops-liability-items`. */
export type OpsLiabilityRow = {
  id: string
  label: string
  notes?: string | null
  sortOrder?: number | null
}

/** Merged scorecard row for /ops (Payload overrides + static fallback). */
export type OpsMergedScorecardRow = {
  formula: string
  manualLine?: string
  name: string
  target: string
}

export type OpsDashboardDutyItemTone = 'default' | 'warning'

export type OpsDashboardDutyItem = {
  href: string
  id: string
  meta: string
  subtitle: string
  title: string
  tone: OpsDashboardDutyItemTone
}

export type OpsDashboardDutySection = {
  description: string
  id: 'billing' | 'crm' | 'today'
  items: OpsDashboardDutyItem[]
  roleSummary?: string
  rhythmSummary?: string
  title: string
}
