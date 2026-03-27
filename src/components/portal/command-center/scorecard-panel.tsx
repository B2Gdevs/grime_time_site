import { CircleAlertIcon, InfoIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import type { OpsLiabilityRow, OpsMergedScorecardRow } from '@/lib/ops/opsDashboardTypes'

import { truncateText } from './helpers'
import type { DetailState } from './types'

export function ScorecardPanel({
  liabilityItems,
  mergedScorecard,
  scorecardTooltipMap,
  setDetail,
}: {
  liabilityItems: OpsLiabilityRow[]
  mergedScorecard: OpsMergedScorecardRow[]
  scorecardTooltipMap: Record<string, string>
  setDetail: (value: DetailState) => void
}) {
  return (
    <Card className="border shadow-sm" data-tour="portal-scorecard-panel">
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
                  <div key={item.name} className="flex flex-col gap-2 rounded-lg border bg-card/60 p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium leading-tight">{item.name}</div>
                        {item.manualLine ? <div className="mt-1 text-xs text-primary">{item.manualLine}</div> : null}
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
  )
}
