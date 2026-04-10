import { redirect } from 'next/navigation'

import { AdminDashboardView } from '@/components/portal/AdminDashboardView'
import { OpsWelcomeDialog } from '@/components/portal/OpsWelcomeDialog'
import { OPS_WORKSPACE_PATH } from '@/lib/navigation/portalPaths'
import { loadOpsRouteData } from '@/lib/ops/loaders/loadOpsRouteData'
import { parseOpsTabQuery } from '@/lib/ops/opsCommandCenterTabs'

type PortalOpsDashboardPageProps = {
  searchParams: Promise<{ tab?: string }>
}

export default async function PortalOpsDashboardPage({
  searchParams,
}: PortalOpsDashboardPageProps) {
  const sp = await searchParams
  const initialCommandCenterTab = parseOpsTabQuery(sp.tab)

  if (initialCommandCenterTab) {
    redirect(`${OPS_WORKSPACE_PATH}?tab=${initialCommandCenterTab}`)
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
