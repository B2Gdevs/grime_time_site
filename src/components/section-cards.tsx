import { InfoIcon, TrendingDownIcon, TrendingUpIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export type SectionCardItem = {
  /** When true, hides description/footer; put definitions in `metricTooltip` (ops KPI row). */
  compact?: boolean
  description?: string
  footer?: string
  metricTooltip?: string
  tone?: 'down' | 'up'
  trend: string
  title: string
  value: string
}

export function SectionCards({ items }: { items: SectionCardItem[] }) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid min-w-0 grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
        {items.map((item) => {
          const TrendIcon = item.tone === 'down' ? TrendingDownIcon : TrendingUpIcon
          const compact = item.compact === true
          const showInfo = Boolean(item.metricTooltip?.trim())

          return (
            <Card
              className="@container/card min-w-0 pb-4 data-[compact=true]:pb-3"
              data-compact={compact ? 'true' : undefined}
              data-slot="card"
              key={item.title}
            >
              <CardHeader className={compact ? 'pb-2' : undefined}>
                <div className="flex flex-wrap items-center gap-1">
                  <CardDescription>{item.title}</CardDescription>
                  {showInfo ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground size-7 shrink-0"
                          aria-label={`About ${item.title}`}
                        >
                          <InfoIcon className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-sm text-left text-xs leading-relaxed">
                        <span className="whitespace-pre-line">{item.metricTooltip}</span>
                      </TooltipContent>
                    </Tooltip>
                  ) : null}
                </div>
                <CardTitle
                  className={
                    compact
                      ? '@[250px]/card:text-4xl text-3xl font-semibold tabular-nums tracking-tight'
                      : '@[250px]/card:text-3xl text-2xl font-semibold tabular-nums'
                  }
                >
                  {item.value}
                </CardTitle>
                <div className="pt-2">
                  <Badge
                    variant="outline"
                    className="text-muted-foreground inline-flex max-w-full gap-1 rounded-lg border-border/70 bg-background/70 text-xs"
                  >
                    <TrendIcon className="size-3 shrink-0" />
                    <span className="truncate">{item.trend}</span>
                  </Badge>
                </div>
              </CardHeader>
              {!compact && item.description != null && item.footer != null ? (
                <CardFooter className="flex-col items-start gap-1 text-sm">
                  <div className="line-clamp-1 flex gap-2 font-medium">
                    {item.description} <TrendIcon className="size-4" />
                  </div>
                  <div className="text-muted-foreground">{item.footer}</div>
                </CardFooter>
              ) : null}
            </Card>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
