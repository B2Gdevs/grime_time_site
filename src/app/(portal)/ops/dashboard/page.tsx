import { redirect } from 'next/navigation'

import { AdminDashboardView } from '@/components/portal/AdminDashboardView'
import { OpsWelcomeDialog } from '@/components/portal/OpsWelcomeDialog'
import { loadOpsRouteData } from '@/lib/ops/loaders/loadOpsRouteData'
import { parseOpsTabQuery } from '@/lib/ops/opsCommandCenterTabs'

type OpsDashboardPageProps = {
  searchParams: Promise<{ tab?: string }>
}

export default async function OpsDashboardPage({ searchParams }: OpsDashboardPageProps) {
  const sp = await searchParams
  const initialCommandCenterTab = parseOpsTabQuery(sp.tab)

  if (initialCommandCenterTab) {
    redirect(`/ops/workspace?tab=${initialCommandCenterTab}`)
  }

  const { data, showWelcomeModal, user } = await loadOpsRouteData()

  return (
    <AdminDashboardView
      cards={data.cards}
      chartDisclaimer={data.chartDisclaimer}
      chartMetricSummaries={data.chartMetricSummaries}
      chartTrend={data.chartTrend}
      chartTrendIsLive={data.chartTrendIsLive}
      pipelineSnapshotLabel={data.pipelineSnapshotLabel}
      pipelineSnapshotValue={data.pipelineSnapshotValue}
    >
      <OpsWelcomeDialog
        openInitially={showWelcomeModal}
        userName={user?.name?.trim() || user?.email || 'team'}
      />
    </AdminDashboardView>
  )
}
