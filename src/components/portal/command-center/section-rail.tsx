'use client'

import { InfoIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { OpsSectionCardContent } from '@/components/portal/ops/OpsSectionCardContent'
import { getOpsSectionMeta, OPS_SECTION_IDS } from '@/lib/ops/uiMeta'

import { CommandCenterDetailPanel } from './detail-panel'
import type { DetailState } from './types'

export function CommandCenterSectionRail({
  defaultDetail,
  detail,
  setDetail,
}: {
  defaultDetail: DetailState
  detail: DetailState
  setDetail: (value: DetailState) => void
}) {
  return (
    <Card className="h-fit min-w-0 xl:sticky xl:top-[var(--portal-sticky-top)]">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Ops workspace
            </p>
            <CardTitle className="mt-2 text-xl">Operate the day in one surface.</CardTitle>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground"
                aria-label="Command center overview"
                onClick={() => setDetail(defaultDetail)}
              >
                <InfoIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              Reset the detail panel to the command-center overview.
            </TooltipContent>
          </Tooltip>
        </div>
        <CardDescription>
          One rail for section switching and detail context. Keep the live work stable while the detail stays pinned.
        </CardDescription>
      </CardHeader>

      <TabsList
        className="mx-6 flex h-auto w-auto min-w-0 flex-col items-stretch gap-2 rounded-2xl border bg-muted/40 p-2"
        data-tour="portal-command-rail"
      >
        {OPS_SECTION_IDS.map((sectionId) => {
          const section = getOpsSectionMeta(sectionId)

          return (
            <TabsTrigger
              key={sectionId}
              value={sectionId}
              className="flex h-auto w-full min-w-0 whitespace-normal items-start justify-start rounded-xl border border-transparent px-3 py-3 text-left shadow-none data-[state=active]:border-border data-[state=active]:bg-background"
            >
              <OpsSectionCardContent
                description={section.railDescription}
                icon={section.icon}
                label={section.label}
              />
            </TabsTrigger>
          )
        })}
      </TabsList>

      <CommandCenterDetailPanel detail={detail} setDetail={setDetail} />
    </Card>
  )
}
