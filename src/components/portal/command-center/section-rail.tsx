'use client'

import { Building2Icon, FileBarChart2Icon, FolderTreeIcon, InfoIcon, TimerResetIcon, WrenchIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import { CommandCenterDetailPanel } from './detail-panel'
import type { DetailState } from './types'

export const commandCenterSections = [
  {
    description: 'Daily route, confirmed jobs, follow-up, and job-flow priorities.',
    icon: TimerResetIcon,
    label: 'today.board',
    value: 'today',
  },
  {
    description: 'First-party CRM queues, companies, contacts, and automation.',
    icon: Building2Icon,
    label: 'crm.workspace',
    value: 'crm',
  },
  {
    description: 'Scorecard definitions, current values, and business drag.',
    icon: FileBarChart2Icon,
    label: 'scorecard.metrics',
    value: 'scorecard',
  },
  {
    description: 'Growth unlocks and next-stage operating standards.',
    icon: FolderTreeIcon,
    label: 'milestones.plan',
    value: 'milestones',
  },
  {
    description: 'Equipment and software decisions by bottleneck.',
    icon: WrenchIcon,
    label: 'assets.stack',
    value: 'assets',
  },
] as const

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
    <Card className="h-fit min-w-0 xl:sticky xl:top-0">
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

      <TabsList className="mx-6 grid h-auto gap-2 rounded-2xl border bg-muted/40 p-2">
        {commandCenterSections.map((section) => {
          const Icon = section.icon

          return (
            <TabsTrigger
              key={section.value}
              value={section.value}
              className="flex h-auto w-full items-start justify-start rounded-xl border border-transparent px-3 py-3 text-left shadow-none data-[state=active]:border-border data-[state=active]:bg-background"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="rounded-lg border bg-background/80 p-2 text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="grid min-w-0 gap-1">
                  <span className="font-mono text-[13px] font-semibold tracking-tight">{section.label}</span>
                  <span className="text-xs leading-5 text-muted-foreground">{section.description}</span>
                </span>
              </div>
            </TabsTrigger>
          )
        })}
      </TabsList>

      <CommandCenterDetailPanel detail={detail} setDetail={setDetail} />
    </Card>
  )
}
