import Link from 'next/link'

import { CalendarClockIcon, FileTextIcon, ShieldIcon } from 'lucide-react'

import { ChartAreaInteractive } from '@/components/chart-area-interactive'
import { CrmProviderCard } from '@/components/portal/CrmProviderCard'
import { DataTable } from '@/components/data-table'
import { SectionCards, type SectionCardItem } from '@/components/section-cards'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  assetLadder,
  businessScorecard,
  growthMilestones,
  liabilityChecklist,
  toolRecommendations,
} from '@/lib/ops/businessOperatingSystem'
import type { CrmProviderSlug, CrmProviderSummary } from '@/lib/crm/types'

export function AdminDashboardView({
  activeCrmProvider,
  cards,
  crmProviders,
}: {
  activeCrmProvider: CrmProviderSlug | null
  cards: SectionCardItem[]
  crmProviders: CrmProviderSummary[]
}) {
  return (
    <>
      <SiteHeader
        title="Ops dashboard"
        description="Internal command center for leads, quotes, scorecards, and growth decisions."
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          className="@container/main portal-scroll flex min-h-0 flex-1 flex-col gap-6 overflow-x-hidden overflow-y-auto overscroll-contain py-4 md:py-6"
          data-portal-scroll=""
        >
          <SectionCards items={cards} />

          <div className="grid min-w-0 gap-4 px-4 lg:px-6 xl:grid-cols-[minmax(0,1.7fr)_22rem]">
            <ChartAreaInteractive />

            <div className="grid gap-4">
              <CrmProviderCard
                activeProvider={activeCrmProvider}
                availableProviders={crmProviders}
              />

              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle>Operator panel</CardTitle>
                  <CardDescription>
                    The ops dashboard is the command center. Payload admin remains the back office.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <Button asChild className="justify-start">
                    <Link href="/docs/business-scorecard-and-growth">
                      <FileTextIcon className="size-4" />
                      Open scorecard
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/docs/quote-system-and-texas-compliance">
                      <FileTextIcon className="size-4" />
                      Open quote playbook
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/schedule">
                      <CalendarClockIcon className="size-4" />
                      Open scheduling
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/admin">
                      <ShieldIcon className="size-4" />
                      Open Payload admin
                    </Link>
                  </Button>

                  <div className="mt-2 grid gap-2 rounded-lg border p-3 text-sm">
                    <div className="font-medium">Current phase-06 focus</div>
                    <div className="text-muted-foreground">{growthMilestones[0]?.winCondition}</div>
                    <div className="text-muted-foreground">Next asset: {assetLadder[1]?.buy}</div>
                    <div className="text-muted-foreground">
                      Weekly review items: {businessScorecard.length} KPIs, {liabilityChecklist.length}{' '}
                      liabilities, {toolRecommendations.length} tool tracks.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <DataTable />
        </div>
      </div>
    </>
  )
}
