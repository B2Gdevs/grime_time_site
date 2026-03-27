import Link from 'next/link'

import {
  CalendarClockIcon,
  FileBarChart2Icon,
  FileTextIcon,
  FolderTreeIcon,
  ReceiptTextIcon,
  Settings2Icon,
  ShieldIcon,
  WrenchIcon,
} from 'lucide-react'

import { ChartAreaInteractive } from '@/components/chart-area-interactive'
import { SectionCards, type SectionCardItem } from '@/components/section-cards'
import { OpsBillingWorkspaceCard } from '@/components/portal/ops/OpsBillingWorkspaceCard'
import { OpsDutyBoard } from '@/components/portal/ops/OpsDutyBoard'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { BillingWorkspaceData } from '@/lib/billing/workspace'
import type { OpsChartTrendPoint } from '@/lib/ops/loadOpsChartTrend'
import type { OpsCommandCenterTabId } from '@/lib/ops/opsCommandCenterTabs'
import type { OpsDashboardDutySection } from '@/lib/ops/opsDashboardTypes'

export function AdminDashboardView({
  billingWorkspace,
  cards,
  chartDisclaimer,
  chartTrend,
  chartTrendIsLive,
  dutySections,
  initialCommandCenterTab,
  pipelineSnapshotLabel,
  pipelineSnapshotValue,
  quotesEnabled,
}: {
  billingWorkspace: BillingWorkspaceData
  cards: SectionCardItem[]
  chartDisclaimer?: string | null
  chartTrend?: OpsChartTrendPoint[] | null
  chartTrendIsLive?: boolean
  dutySections: OpsDashboardDutySection[]
  initialCommandCenterTab?: OpsCommandCenterTabId
  pipelineSnapshotLabel?: string | null
  pipelineSnapshotValue?: string | null
  quotesEnabled: boolean
}) {
  return (
    <>
      <SiteHeader
        title="Ops dashboard"
        description="Duties-first staff dashboard for CRM, billing follow-up, route work, scorecards, and growth decisions."
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          className="@container/main portal-scroll flex min-h-0 flex-1 flex-col gap-6 overflow-x-hidden overflow-y-auto overscroll-contain py-4 md:py-6"
          data-portal-scroll=""
        >
          <div data-tour="portal-kpi-cards">
            <SectionCards items={cards} />
          </div>

          <div className="grid gap-4 px-4 lg:px-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
            <OpsDutyBoard dutySections={dutySections} initialCommandCenterTab={initialCommandCenterTab} />
            <OpsBillingWorkspaceCard initialData={billingWorkspace} />
          </div>

          <div className="grid min-w-0 gap-4 px-4 lg:px-6 xl:grid-cols-[minmax(0,1.7fr)_22rem]">
            <ChartAreaInteractive
              chartTrend={chartTrend ?? null}
              chartTrendIsLive={chartTrendIsLive}
              disclaimer={chartDisclaimer}
              pipelineSnapshotLabel={pipelineSnapshotLabel}
              pipelineSnapshotValue={pipelineSnapshotValue}
            />

            <div className="grid gap-4">
              <Card className="min-w-0" data-tour="portal-operator-panel">
                <CardHeader>
                  <CardTitle>Operator panel</CardTitle>
                  <CardDescription>Jump into focused ops routes first, then use admin CRUD when needed.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <Button asChild className="justify-start">
                    <Link href="/ops/crm">
                      <ReceiptTextIcon className="size-4" />
                      Open CRM workspace
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/ops/today">
                      <CalendarClockIcon className="size-4" />
                      Open today board
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/ops/scorecard">
                      <FileBarChart2Icon className="size-4" />
                      Open scorecard
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/ops/milestones">
                      <FolderTreeIcon className="size-4" />
                      Open milestones
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/ops/assets">
                      <WrenchIcon className="size-4" />
                      Open assets
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/admin/collections/leads">
                      <ReceiptTextIcon className="size-4" />
                      Open leads
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/admin/collections/crm-tasks">
                      <ReceiptTextIcon className="size-4" />
                      Open CRM tasks
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/admin/collections/invoices">
                      <ReceiptTextIcon className="size-4" />
                      Open invoices
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/admin/collections/service-plans">
                      <ReceiptTextIcon className="size-4" />
                      Open service plans
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/admin/collections/billing-events">
                      <ReceiptTextIcon className="size-4" />
                      Open billing events
                    </Link>
                  </Button>
                  {quotesEnabled ? (
                    <Button asChild className="justify-start">
                      <Link href="/admin/collections/quotes">
                        <ReceiptTextIcon className="size-4" />
                        Open quotes
                      </Link>
                    </Button>
                  ) : null}
                  <Button asChild className="justify-start">
                    <Link href="/admin/globals/quoteSettings">
                      <Settings2Icon className="size-4" />
                      Open quote settings
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/admin/collections/opportunities">
                      <FileTextIcon className="size-4" />
                      Open opportunities
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/admin/collections/crm-sequences">
                      <FileTextIcon className="size-4" />
                      Open sequences
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/admin">
                      <ShieldIcon className="size-4" />
                      Open Payload admin
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
