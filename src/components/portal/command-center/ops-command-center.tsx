'use client'

import * as React from 'react'

import { CrmWorkspace } from '@/components/portal/crm/CrmWorkspace'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'

import { AssetsPanel } from './assets-panel'
import { MilestonesPanel } from './milestones-panel'
import { ScorecardPanel } from './scorecard-panel'
import { CommandCenterSectionRail } from './section-rail'
import { TodayBoardPanel } from './today-panel'
import type { DetailState, OpsCommandCenterProps } from './types'

const defaultDetail: DetailState = {
  body:
    'Use the left rail to switch between the operating board, CRM workspace, scorecard, milestones, and asset ladder. Detail selected from any tab shows up here instead of opening on top of the dashboard.',
  description: 'Command center context',
  kind: 'text',
  title: 'Internal command center',
}

export function OpsCommandCenter({
  assetLadderItems,
  crmWorkspace,
  growthMilestones,
  liabilityItems,
  mergedScorecard,
  scorecardTooltipMap,
}: OpsCommandCenterProps) {
  const [detail, setDetail] = React.useState<DetailState>(defaultDetail)

  return (
    <TooltipProvider delayDuration={200}>
      <Tabs defaultValue="today" className="w-full min-w-0 px-4 lg:px-6">
        <div className="grid gap-4 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <CommandCenterSectionRail defaultDetail={defaultDetail} detail={detail} setDetail={setDetail} />

          <div className="min-w-0">
            <TabsContent value="today" className="mt-0 min-w-0">
              <TodayBoardPanel setDetail={setDetail} />
            </TabsContent>

            <TabsContent value="crm" className="mt-0 min-w-0">
              <CrmWorkspace initialData={crmWorkspace} setDetail={setDetail} />
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
  )
}
