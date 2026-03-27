import { AdminDashboardView } from '@/components/portal/AdminDashboardView'
import { loadOpsRouteData } from '@/lib/ops/loaders/loadOpsRouteData'
import { parseOpsTabQuery } from '@/lib/ops/opsCommandCenterTabs'

type OpsPageProps = {
  searchParams: Promise<{ tab?: string }>
}

export default async function OpsDashboardPage({ searchParams }: OpsPageProps) {
  const sp = await searchParams
  const initialCommandCenterTab = parseOpsTabQuery(sp.tab) ?? undefined
  const { data } = await loadOpsRouteData()

  return (
    <AdminDashboardView
      billingWorkspace={data.billingWorkspace}
      cards={data.cards}
      chartDisclaimer={data.chartDisclaimer}
      chartTrend={data.chartTrend}
      chartTrendIsLive={data.chartTrendIsLive}
      dutySections={data.dutySections}
      initialCommandCenterTab={initialCommandCenterTab}
      pipelineSnapshotLabel={data.pipelineSnapshotLabel}
      pipelineSnapshotValue={data.pipelineSnapshotValue}
      quotesEnabled={data.quotesEnabled}
    />
  )
}
