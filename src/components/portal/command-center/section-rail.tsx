'use client'

import { InfoIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { OpsSectionCardContent } from '@/components/portal/ops/OpsSectionCardContent'
import { listOpsSectionMeta } from '@/lib/ops/uiMeta'

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
  const commandCenterSections = listOpsSectionMeta()

  return (
    <Card className="h-fit min-w-0 xl:sticky xl:top-[var(--portal-sticky-top)]">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Internal command center
            </p>
            <CardTitle className="mt-2 text-xl">Operate the day like a live job.</CardTitle>
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
          One rail for section switching and detail context. The right side stays focused on live work.
        </CardDescription>
      </CardHeader>

      <TabsList
        className="mx-6 grid h-auto gap-2 rounded-2xl border bg-muted/40 p-2"
        data-tour="portal-command-rail"
      >
        {commandCenterSections.map((section) => {
          return (
            <TabsTrigger
              key={section.href}
              value={section.href.split('/').at(-1) ?? 'today'}
              className="flex h-auto w-full items-start justify-start rounded-xl border border-transparent px-3 py-3 text-left shadow-none data-[state=active]:border-border data-[state=active]:bg-background"
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
