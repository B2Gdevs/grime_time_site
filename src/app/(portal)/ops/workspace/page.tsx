import { OpsCommandCenter } from '@/components/portal/command-center/ops-command-center'
import { SiteHeader } from '@/components/site-header'
import { loadOpsRouteData } from '@/lib/ops/loaders/loadOpsRouteData'
import { parseOpsTabQuery } from '@/lib/ops/opsCommandCenterTabs'

type OpsWorkspacePageProps = {
  searchParams: Promise<{ tab?: string }>
}

export default async function OpsWorkspacePage({ searchParams }: OpsWorkspacePageProps) {
  const sp = await searchParams
  const initialTab = parseOpsTabQuery(sp.tab) ?? 'today'
  const { data } = await loadOpsRouteData()

  return (
    <>
      <SiteHeader
        title="Ops workspace"
        description="Live queues, billing follow-up, route work, scorecards, and planning in one non-overlapping surface."
      />
      <div className="@container/main flex flex-col py-4 md:py-6">
        <OpsCommandCenter
          assetLadderItems={data.assetLadderItems}
          billingWorkspace={data.billingWorkspace}
          crmWorkspace={data.crmWorkspace}
          growthMilestones={data.growthMilestones}
          initialTab={initialTab}
          liabilityItems={data.liabilityItems}
          mergedScorecard={data.mergedScorecard}
          scorecardTooltipMap={data.scorecardTooltipMap}
        />
      </div>
    </>
  )
}
