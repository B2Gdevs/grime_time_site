import { InfoIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import type { OpsGrowthMilestoneRow } from '@/lib/ops/opsDashboardTypes'

import { truncateText } from './helpers'
import type { DetailState } from './types'

export function MilestonesPanel({
  growthMilestones,
  setDetail,
}: {
  growthMilestones: OpsGrowthMilestoneRow[]
  setDetail: (value: DetailState) => void
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
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
    </div>
  )
}
