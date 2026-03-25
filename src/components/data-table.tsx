'use client'

import * as React from 'react'
import {
  CircleAlertIcon,
  FileBarChart2Icon,
  FolderTreeIcon,
  InfoIcon,
  TimerResetIcon,
  WrenchIcon,
} from 'lucide-react'

import { OperatingDayCalendar } from '@/components/portal/OperatingDayCalendar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type {
  OpsAssetLadderRow,
  OpsGrowthMilestoneRow,
  OpsLiabilityRow,
  OpsMergedScorecardRow,
} from '@/lib/ops/opsDashboardTypes'

const commandCenterSections = [
  {
    description: 'Daily route, confirmed jobs, follow-up, and job-flow priorities.',
    icon: TimerResetIcon,
    label: 'today.board',
    value: 'today',
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

type DetailState = {
  body: string
  description?: string
  title: string
}

const defaultDetail: DetailState = {
  body:
    'Use the left rail to switch between the operating board, scorecard, milestones, and asset ladder. Detail selected from any tab shows up here instead of opening on top of the dashboard.',
  description: 'Command center context',
  title: 'Internal command center',
}

function truncateText(text: string, max = 120): string {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 3)}...`
}

export function DataTable({
  assetLadderItems,
  growthMilestones,
  hubSpotOpsEnabled,
  liabilityItems,
  mergedScorecard,
  scorecardTooltipMap,
}: {
  assetLadderItems: OpsAssetLadderRow[]
  growthMilestones: OpsGrowthMilestoneRow[]
  hubSpotOpsEnabled: boolean
  liabilityItems: OpsLiabilityRow[]
  mergedScorecard: OpsMergedScorecardRow[]
  scorecardTooltipMap: Record<string, string>
}) {
  const [detail, setDetail] = React.useState<DetailState>(defaultDetail)

  return (
    <TooltipProvider delayDuration={200}>
      <Tabs defaultValue="today" className="w-full min-w-0 px-4 lg:px-6">
        <div className="grid gap-4 xl:grid-cols-[22rem_minmax(0,1fr)]">
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
                One rail for section switching and detail context. The right side stays focused on the live board.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <TabsList className="grid h-auto gap-2 rounded-2xl border bg-muted/40 p-2">
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
                          <span className="font-mono text-[13px] font-semibold tracking-tight">
                            {section.label}
                          </span>
                          <span className="text-xs leading-5 text-muted-foreground">
                            {section.description}
                          </span>
                        </span>
                      </div>
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              <div className="rounded-2xl border bg-muted/20 p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{detail.title}</p>
                    {detail.description ? (
                      <p className="text-xs text-muted-foreground">{detail.description}</p>
                    ) : null}
                  </div>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {detail.body}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="min-w-0">
            <TabsContent value="today" className="mt-0 min-w-0">
              <Card className="border shadow-sm">
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>Daily operating board</CardTitle>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground"
                              aria-label="Calendar help"
                              onClick={() =>
                                setDetail({
                                  body:
                                    'The calendar now marks dates that have scheduled or requested jobs. Pick a date to see those jobs first, then HubSpot tasks for the same day when HubSpot is active.',
                                  description: 'Calendar behavior',
                                  title: 'Daily operating board',
                                })
                              }
                            >
                              <InfoIcon className="size-4" />
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          Scheduled jobs show directly on the board. HubSpot tasks still load when the provider is active.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <CardDescription>Calendar, scheduled jobs, and CRM tasks for the selected day.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="min-w-0">
                  <OperatingDayCalendar hubSpotOpsEnabled={hubSpotOpsEnabled} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scorecard" className="mt-0 min-w-0">
              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle>Scorecard</CardTitle>
                      <CardDescription>KPI definitions, manual values, and liability tracking.</CardDescription>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0 text-muted-foreground"
                          aria-label="Scorecard tab help"
                          onClick={() =>
                            setDetail({
                              body:
                                'Rows from ops-scorecard-rows merge over the built-in defaults. Manual values and labels now surface both here and on the top KPI cards.',
                              description: 'How the scorecard powers the dashboard',
                              title: 'Scorecard metrics',
                            })
                          }
                        >
                          <InfoIcon className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Payload scorecard rows now drive definitions and manual KPI values used on the dashboard.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Tabs defaultValue="definitions" className="w-full">
                    <TabsList className="h-9 w-full justify-start rounded-lg bg-muted/60 p-1 sm:w-auto">
                      <TabsTrigger value="definitions" className="text-xs sm:text-sm">
                        KPI definitions
                      </TabsTrigger>
                      <TabsTrigger value="liabilities" className="text-xs sm:text-sm">
                        Liabilities
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="definitions" className="mt-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {mergedScorecard.map((item) => {
                          const staffTip = scorecardTooltipMap[item.name]

                          return (
                            <div
                              key={item.name}
                              className="flex flex-col gap-2 rounded-lg border bg-card/60 p-3 text-sm"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="font-medium leading-tight">{item.name}</div>
                                  {item.manualLine ? (
                                    <div className="mt-1 text-xs text-primary">{item.manualLine}</div>
                                  ) : null}
                                </div>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 shrink-0 text-muted-foreground"
                                      aria-label={`Details: ${item.name}`}
                                      onClick={() =>
                                        setDetail({
                                          body: `${item.formula}\n\nTarget logic:\n${item.target}${
                                            item.manualLine ? `\n\n${item.manualLine}` : ''
                                          }`,
                                          description: 'Formula and target logic',
                                          title: item.name,
                                        })
                                      }
                                    >
                                      <InfoIcon className="size-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="left" className="max-w-xs">
                                    {staffTip ?? 'Open the left detail panel for the full formula and target logic.'}
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <p className="text-xs leading-relaxed text-muted-foreground">
                                {truncateText(item.formula, 140)}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    </TabsContent>
                    <TabsContent value="liabilities" className="mt-3">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          {liabilityItems.length} item{liabilityItems.length === 1 ? '' : 's'} tracked from Payload CRUD.
                        </p>
                        <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                          <a href="/admin/collections/ops-liability-items">Manage liabilities</a>
                        </Button>
                      </div>
                      <div className="grid max-h-[min(50vh,28rem)] gap-1.5 overflow-y-auto text-sm">
                        {liabilityItems.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No liability rows yet. Seed or add them in Payload under Internal.
                          </p>
                        ) : (
                          liabilityItems.map((row) => (
                            <button
                              key={row.id}
                              type="button"
                              className="flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-left hover:bg-muted/50"
                              onClick={() =>
                                setDetail({
                                  body: row.notes?.trim() || row.label,
                                  description: 'Liability note',
                                  title: row.label,
                                })
                              }
                            >
                              <CircleAlertIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                              <span className="leading-snug">{row.label}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="milestones" className="mt-0 min-w-0 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <Card>
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
                  <div>
                    <CardTitle>Growth ladder</CardTitle>
                    <CardDescription>Editable milestone rows powering the ops dashboard.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 shrink-0 text-xs" asChild>
                    <a href="/admin/collections/growth-milestones">Manage milestones</a>
                  </Button>
                </CardHeader>
                <CardContent className="rounded-lg border">
                  {growthMilestones.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">
                      No milestones yet. Seed or add rows in Payload under Internal.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Milestone</TableHead>
                            <TableHead className="hidden md:table-cell">Trigger</TableHead>
                            <TableHead className="w-12 text-right"> </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {growthMilestones.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="max-w-[12rem] align-top font-medium">{item.title}</TableCell>
                              <TableCell className="hidden max-w-xl align-top text-sm text-muted-foreground md:table-cell">
                                {item.trigger ? truncateText(item.trigger, 120) : '-'}
                              </TableCell>
                              <TableCell className="align-top text-right">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground"
                                  aria-label={`Details: ${item.title}`}
                                  onClick={() =>
                                    setDetail({
                                      body: `Trigger:\n${item.trigger ?? '-'}\n\nWin condition:\n${item.winCondition ?? '-'}`,
                                      description: 'Trigger and win condition',
                                      title: item.title,
                                    })
                                  }
                                >
                                  <InfoIcon className="size-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Current guidance</CardTitle>
                  <CardDescription>Push these standards before hiring or major equipment.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm">
                  <div className="rounded-lg border px-3 py-2">
                    <div className="mb-1 font-medium">Sales discipline</div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Same-day quotes and follow-up usually beat a bigger machine early on.
                    </p>
                  </div>
                  <div className="rounded-lg border px-3 py-2">
                    <div className="mb-1 font-medium">Route density</div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Group jobs by area before chasing more leads. Dead miles kill margin.
                    </p>
                  </div>
                  <div className="rounded-lg border px-3 py-2">
                    <div className="mb-1 font-medium">Maintenance plans</div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Recurring exterior work is the cleanest path to MRR and a stable schedule.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assets" className="mt-0 min-w-0">
              <Card>
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
                  <div>
                    <CardTitle>Asset ladder</CardTitle>
                    <CardDescription>Payload-backed equipment and software progression.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 shrink-0 text-xs" asChild>
                    <a href="/admin/collections/ops-asset-ladder-items">Manage assets</a>
                  </Button>
                </CardHeader>
                <CardContent className="rounded-lg border">
                  {assetLadderItems.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">
                      No ladder rows yet. Seed or add items in Payload under Internal.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Stage</TableHead>
                            <TableHead className="hidden lg:table-cell">Notes</TableHead>
                            <TableHead className="w-24">Status</TableHead>
                            <TableHead className="w-12 text-right"> </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assetLadderItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="max-w-[10rem] align-top font-medium">{item.label}</TableCell>
                              <TableCell className="hidden max-w-xl align-top text-sm text-muted-foreground lg:table-cell">
                                {item.buyNotes ? truncateText(item.buyNotes, 110) : '-'}
                              </TableCell>
                              <TableCell className="align-top">
                                <Badge variant={item.owned ? 'default' : 'secondary'} className="text-[10px]">
                                  {item.owned ? 'Have' : 'Want'}
                                </Badge>
                              </TableCell>
                              <TableCell className="align-top text-right">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground"
                                  aria-label={`Details: ${item.label}`}
                                  onClick={() =>
                                    setDetail({
                                      body: `Buy / spec:\n${item.buyNotes ?? '-'}\n\nWhy:\n${item.whyNotes ?? '-'}`,
                                      description: 'Buy notes and rationale',
                                      title: item.label,
                                    })
                                  }
                                >
                                  <InfoIcon className="size-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </TooltipProvider>
  )
}
