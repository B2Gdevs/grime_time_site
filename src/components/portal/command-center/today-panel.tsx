import { InfoIcon } from 'lucide-react'

import { OperatingDayCalendar } from '@/components/portal/OperatingDayCalendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import type { DetailState } from './types'

export function TodayBoardPanel({ setDetail }: { setDetail: (value: DetailState) => void }) {
  return (
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
                          'The calendar marks dates that have scheduled or requested jobs. Pick a date to see the workload for that day without leaving the dashboard.',
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
                Scheduled jobs and requests show directly on the board from Payload data.
              </TooltipContent>
            </Tooltip>
          </div>
          <CardDescription>Calendar and scheduled jobs for the selected day.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="min-w-0">
        <OperatingDayCalendar />
      </CardContent>
    </Card>
  )
}
