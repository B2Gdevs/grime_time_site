'use client'

import * as React from 'react'

import { CrmWorkspace } from '@/components/portal/crm/CrmWorkspace'
import { OpsBillingWorkspaceCard } from '@/components/portal/ops/OpsBillingWorkspaceCard'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useRouter, useSearchParams } from 'next/navigation'

import { AssetsPanel } from './assets-panel'
import { MilestonesPanel } from './milestones-panel'
import { ScorecardPanel } from './scorecard-panel'
import { CommandCenterSectionRail } from './section-rail'
import { TodayBoardPanel } from './today-panel'
import type { DetailState, OpsCommandCenterProps } from './types'
import type { OpsCommandCenterTabId } from '@/lib/ops/opsCommandCenterTabs'
import { buildOpsTabUrl, parseOpsTabQuery } from '@/lib/ops/opsCommandCenterTabs'
import { getOpsSectionMeta } from '@/lib/ops/uiMeta'

function buildDefaultDetail(tab: OpsCommandCenterTabId): DetailState {
  const meta = getOpsSectionMeta(tab)

  return {
    body: meta.defaultDetailBody,
    description: meta.defaultDetailDescription,
    kind: 'text',
    title: meta.pageTitle,
  }
}

export function OpsCommandCenter({
  assetLadderItems,
  billingWorkspace,
  crmWorkspace,
  growthMilestones,
  initialTab = 'today',
  liabilityItems,
  mergedScorecard,
  scorecardTooltipMap,
}: OpsCommandCenterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = React.useState<OpsCommandCenterTabId>(initialTab)
  const [detail, setDetail] = React.useState<DetailState>(() => buildDefaultDetail(initialTab))

  // Sync active tab with `?tab=` so back/forward + deep links behave predictably.
  React.useEffect(() => {
    const parsed = parseOpsTabQuery(searchParams.get('tab') ?? undefined)
    if (parsed && parsed !== activeTab) {
      setActiveTab(parsed)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  React.useEffect(() => {
    setDetail(buildDefaultDetail(activeTab))
  }, [activeTab])

  const setTabAndUrl = React.useCallback(
    (next: string) => {
      const parsed = parseOpsTabQuery(next)
      if (!parsed) return

      setActiveTab(parsed)

      router.replace(buildOpsTabUrl(searchParams, parsed), { scroll: false })
    },
    [activeTab, router, searchParams],
  )

  return (
    <div className="w-full min-w-0" data-tour="portal-command-center">
      <TooltipProvider delayDuration={200}>
        <Tabs
          key={initialTab}
          value={activeTab}
          onValueChange={(nextValue) => setTabAndUrl(nextValue)}
          className="w-full min-w-0 px-4 lg:px-6"
        >
          <div className="grid gap-4 xl:grid-cols-[22rem_minmax(0,1fr)]">
            <CommandCenterSectionRail
              defaultDetail={buildDefaultDetail(activeTab)}
              detail={detail}
              setDetail={setDetail}
            />

            <div className="min-w-0">
              <TabsContent value="today" className="mt-0 min-w-0">
                <TodayBoardPanel setDetail={setDetail} />
              </TabsContent>

              <TabsContent value="crm" className="mt-0 min-w-0">
                <CrmWorkspace initialData={crmWorkspace} setDetail={setDetail} />
              </TabsContent>

              <TabsContent value="billing" className="mt-0 min-w-0">
                <OpsBillingWorkspaceCard initialData={billingWorkspace} />
              </TabsContent>

              <TabsContent value="scorecard" className="mt-0 min-w-0">
                <ScorecardPanel
                  liabilityItems={liabilityItems}
                  mergedScorecard={mergedScorecard}
                  scorecardTooltipMap={scorecardTooltipMap}
                  setDetail={setDetail}
                />
              </TabsContent>

              <TabsContent value="milestones" className="mt-0 min-w-0">
                <MilestonesPanel growthMilestones={growthMilestones} setDetail={setDetail} />
              </TabsContent>

              <TabsContent value="assets" className="mt-0 min-w-0">
                <AssetsPanel assetLadderItems={assetLadderItems} setDetail={setDetail} />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </TooltipProvider>
    </div>
  )
}
