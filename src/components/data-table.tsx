'use client'

import {
  ArrowUpRightIcon,
  CircleAlertIcon,
  FileBarChart2Icon,
  FolderTreeIcon,
  TargetIcon,
  TimerResetIcon,
  WrenchIcon,
} from 'lucide-react'

import {
  assetLadder,
  businessScorecard,
  growthMilestones,
  liabilityChecklist,
  operatingRhythm,
  toolRecommendations,
} from '@/lib/ops/businessOperatingSystem'
import {
  commandCenterNotes,
  todayOpsBoard,
  weeklyOpsBoard,
} from '@/lib/ops/internalDashboardData'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const commandCenterSections = [
  {
    description: 'Daily route, follow-up, and job-flow priorities.',
    icon: TimerResetIcon,
    label: 'today.board',
    value: 'today',
  },
  {
    description: 'Definitions for KPI targets and business drag.',
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

export function DataTable() {
  return (
    <Tabs
      defaultValue="today"
      className="grid w-full min-w-0 gap-4 px-4 lg:px-6 xl:grid-cols-[18rem_minmax(0,1fr)]"
    >
      <div className="grid gap-4 xl:content-start">
        <div className="rounded-3xl border bg-card/80 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Internal command center
          </p>
          <h2 className="mt-3 text-xl font-semibold">Operate the day like a live job folder.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Use the portal for rhythm, scorecards, and growth decisions. Use Payload admin for
            record entry and document management.
          </p>
        </div>

        <TabsList className="grid h-auto gap-2 rounded-3xl border bg-card/70 p-3">
          {commandCenterSections.map((section) => {
            const Icon = section.icon

            return (
              <TabsTrigger
                key={section.value}
                value={section.value}
                className="flex h-auto w-full items-start justify-start rounded-2xl border border-transparent px-3 py-3 text-left data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 rounded-lg border bg-background/80 p-2 text-primary">
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
      </div>

      <TabsContent value="today" className="mt-0 min-w-0 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Daily operating board</CardTitle>
            <CardDescription>
              Default day plan unless weather or access forces a route change.
            </CardDescription>
          </CardHeader>
          <CardContent className="rounded-lg border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Time</TableHead>
                    <TableHead>Focus</TableHead>
                    <TableHead className="hidden xl:table-cell">What good looks like</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayOpsBoard.map((item) => (
                    <TableRow key={item.time}>
                      <TableCell className="font-medium">{item.time}</TableCell>
                      <TableCell>{item.focus}</TableCell>
                      <TableCell className="hidden text-muted-foreground xl:table-cell">
                        {item.success}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Command notes</CardTitle>
            <CardDescription>What this dashboard is supposed to do.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {commandCenterNotes.map((note) => (
              <div key={note} className="rounded-lg border p-3 text-muted-foreground">
                {note}
              </div>
            ))}
            <div className="rounded-lg border p-3">
              <div className="mb-2 flex items-center gap-2 font-medium">
                <TargetIcon className="size-4" />
                Weekly review rhythm
              </div>
              <div className="grid gap-2 text-muted-foreground">
                {weeklyOpsBoard.map((item) => (
                  <div key={item.day}>
                    <span className="font-medium text-foreground">{item.day}:</span> {item.checkpoint}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="mb-2 flex items-center gap-2 font-medium">
                <ArrowUpRightIcon className="size-4" />
                Monthly check
              </div>
              <div className="grid gap-2 text-muted-foreground">
                {operatingRhythm.monthly.map((item) => (
                  <div key={item}>{item}</div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent
        value="scorecard"
        className="mt-0 min-w-0 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]"
      >
        <Card>
          <CardHeader>
            <CardTitle>Scorecard definitions</CardTitle>
            <CardDescription>
              Keep definitions stable and only adjust targets as the business matures.
            </CardDescription>
          </CardHeader>
          <CardContent className="rounded-lg border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>KPI</TableHead>
                    <TableHead>Formula</TableHead>
                    <TableHead className="hidden xl:table-cell">Target logic</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businessScorecard.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.formula}</TableCell>
                      <TableCell className="hidden text-muted-foreground xl:table-cell">
                        {item.target}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Liabilities and drag</CardTitle>
            <CardDescription>Track these before they become surprises.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {liabilityChecklist.map((item) => (
              <div key={item} className="rounded-lg border p-3">
                <div className="flex items-start gap-2">
                  <CircleAlertIcon className="mt-0.5 size-4 text-muted-foreground" />
                  <div>{item}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent
        value="milestones"
        className="mt-0 min-w-0 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]"
      >
        <Card>
          <CardHeader>
            <CardTitle>Growth ladder</CardTitle>
            <CardDescription>
              Treat each stage like an unlock. Hit the operating standard, then buy complexity.
            </CardDescription>
          </CardHeader>
          <CardContent className="rounded-lg border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Milestone</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Win condition</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {growthMilestones.map((item) => (
                    <TableRow key={item.milestone}>
                      <TableCell className="font-medium">{item.milestone}</TableCell>
                      <TableCell>{item.trigger}</TableCell>
                      <TableCell className="text-muted-foreground">{item.winCondition}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current guidance</CardTitle>
            <CardDescription>What to push before hiring or major equipment.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="rounded-lg border p-3">
              <div className="mb-2 font-medium">Sales discipline</div>
              <div className="text-muted-foreground">
                Same-day quote delivery and consistent follow-up usually move revenue faster than a
                bigger machine.
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="mb-2 font-medium">Route density</div>
              <div className="text-muted-foreground">
                Group work by area before chasing more lead volume. Extra miles kill margin.
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="mb-2 font-medium">Maintenance plans</div>
              <div className="text-muted-foreground">
                Recurring exterior service is the cleanest path to MRR and schedule stability.
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent
        value="assets"
        className="mt-0 min-w-0 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]"
      >
        <Card>
          <CardHeader>
            <CardTitle>Asset ladder</CardTitle>
            <CardDescription>Buy the next tool only when it removes the current bottleneck.</CardDescription>
          </CardHeader>
          <CardContent className="rounded-lg border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stage</TableHead>
                    <TableHead>Buy</TableHead>
                    <TableHead>Why</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assetLadder.map((item) => (
                    <TableRow key={item.category}>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell>{item.buy}</TableCell>
                      <TableCell className="text-muted-foreground">{item.why}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Software recommendations</CardTitle>
            <CardDescription>Operational tools that fit the phase-06 plan.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {toolRecommendations.map((item) => (
              <div key={item.category} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <WrenchIcon className="size-4" />
                  {item.category}
                </div>
                <div className="text-muted-foreground">{item.recommendation}</div>
              </div>
            ))}
            <div className="rounded-lg border p-3">
              <div className="mb-2 font-medium">Current machine guidance</div>
              <div className="text-muted-foreground">
                With one pressure washer already in hand, the first upgrades should be surface
                cleaner, hose/reel, then a buffer tank. Move to higher-GPM gear only after the work
                mix proves it.
              </div>
              <Badge variant="outline" className="mt-3">
                Start with throughput, not prestige
              </Badge>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
