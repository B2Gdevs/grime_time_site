import type { BillingWorkspaceData } from '@/lib/billing/workspace'
import type { CrmRecordDetail, CrmWorkspaceData } from '@/lib/crm/workspace'
import type {
  OpsAssetLadderRow,
  OpsGrowthMilestoneRow,
  OpsLiabilityRow,
  OpsMergedScorecardRow,
} from '@/lib/ops/opsDashboardTypes'
import type { OpsCommandCenterTabId } from '@/lib/ops/opsCommandCenterTabs'

export type DetailState = {
  body?: string
  crmDetail?: CrmRecordDetail
  description?: string
  kind?: 'crm' | 'text'
  reloadDetail?: (() => Promise<DetailState | null>) | null
  title: string
}

export type OpsCommandCenterProps = {
  assetLadderItems: OpsAssetLadderRow[]
  billingWorkspace: BillingWorkspaceData
  crmWorkspace: CrmWorkspaceData
  growthMilestones: OpsGrowthMilestoneRow[]
  initialTab?: OpsCommandCenterTabId
  liabilityItems: OpsLiabilityRow[]
  mergedScorecard: OpsMergedScorecardRow[]
  scorecardTooltipMap: Record<string, string>
}
