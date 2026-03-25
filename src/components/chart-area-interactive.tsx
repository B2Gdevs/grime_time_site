'use client'

import * as React from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { opsTrendData } from '@/lib/ops/internalDashboardData'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const metricMeta = {
  grossMargin: {
    description: 'Watch margin before adding overhead or discounting too hard.',
    label: 'Gross margin',
  },
  mrr: {
    description: 'Recurring maintenance revenue should smooth out the slower weeks.',
    label: 'MRR',
  },
  projectedRevenue: {
    description: 'Weighted pipeline tells you what the next few weeks can realistically support.',
    label: 'Projected revenue',
  },
  revenue: {
    description: 'Closed revenue shows whether the field and sales rhythm are actually working.',
    label: 'Revenue',
  },
} as const

const chartConfig = {
  grossMargin: {
    color: 'hsl(var(--chart-4))',
    label: 'Gross margin',
  },
  mrr: {
    color: 'hsl(var(--chart-2))',
    label: 'MRR',
  },
  projectedRevenue: {
    color: 'hsl(var(--chart-3))',
    label: 'Projected revenue',
  },
  revenue: {
    color: 'hsl(var(--chart-1))',
    label: 'Revenue',
  },
} satisfies ChartConfig

type MetricKey = keyof typeof metricMeta

function formatMetricValue(metric: MetricKey, value: number): string {
  if (metric === 'grossMargin') return `${value}%`

  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

export function ChartAreaInteractive({
  disclaimer,
  pipelineSnapshotLabel,
  pipelineSnapshotValue,
}: {
  /** Shown under the chart — e.g. from Internal ops targets global. */
  disclaimer?: string | null
  /** When HubSpot returns pipeline totals, show next to the illustrative chart. */
  pipelineSnapshotLabel?: string | null
  pipelineSnapshotValue?: string | null
}) {
  const [metric, setMetric] = React.useState<MetricKey>('projectedRevenue')
  const latestValue = opsTrendData[opsTrendData.length - 1]?.[metric] ?? 0

  return (
    <Card className="@container/card min-w-0">
      <CardHeader className="min-w-0">
        <div className="flex min-w-0 flex-col gap-4 @[720px]/card:flex-row @[720px]/card:items-start @[720px]/card:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Business momentum</CardTitle>
              <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                Illustrative
              </span>
            </div>
            <CardDescription>{metricMeta[metric].description}</CardDescription>
          </div>
          <div className="hidden @[720px]/card:flex">
            <ToggleGroup
              className="rounded-lg border bg-background p-1"
              onValueChange={(value) => {
                if (value) setMetric(value as MetricKey)
              }}
              type="single"
              value={metric}
              variant="outline"
            >
              <ToggleGroupItem value="projectedRevenue" className="px-2.5">
                Pipeline
              </ToggleGroupItem>
              <ToggleGroupItem value="revenue" className="px-2.5">
                Revenue
              </ToggleGroupItem>
              <ToggleGroupItem value="mrr" className="px-2.5">
                MRR
              </ToggleGroupItem>
              <ToggleGroupItem value="grossMargin" className="px-2.5">
                Margin
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
        <div className="@[720px]/card:hidden mt-3">
          <Select onValueChange={(value) => setMetric(value as MetricKey)} value={metric}>
            <SelectTrigger aria-label="Select metric" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="projectedRevenue">Projected revenue</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="mrr">MRR</SelectItem>
              <SelectItem value="grossMargin">Gross margin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="pt-2 text-3xl font-semibold tabular-nums">
          {formatMetricValue(metric, latestValue)}
        </div>
        {pipelineSnapshotLabel && pipelineSnapshotValue ? (
          <p className="text-muted-foreground pt-1 text-xs leading-relaxed">
            <span className="font-medium text-foreground">{pipelineSnapshotLabel}:</span>{' '}
            {pipelineSnapshotValue} (CRM snapshot; chart series remains illustrative.)
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="min-w-0 px-2 pt-2 sm:px-6">
        <ChartContainer className="h-[280px] w-full" config={chartConfig}>
          <AreaChart accessibilityLayer data={[...opsTrendData]} margin={{ left: 8, right: 8 }}>
            <defs>
              <linearGradient id={`fill-${metric}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor={`var(--color-${metric})`} stopOpacity={0.85} />
                <stop offset="95%" stopColor={`var(--color-${metric})`} stopOpacity={0.12} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis axisLine={false} dataKey="month" tickLine={false} tickMargin={8} />
            <YAxis
              axisLine={false}
              tickFormatter={(value) =>
                metric === 'grossMargin' ? `${value}%` : `$${Number(value) / 1000}k`
              }
              tickLine={false}
              width={44}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => formatMetricValue(metric, Number(value))}
                  indicator="dot"
                />
              }
              cursor={false}
            />
            <Area
              dataKey={metric}
              fill={`url(#fill-${metric})`}
              stroke={`var(--color-${metric})`}
              strokeWidth={2}
              type="natural"
            />
          </AreaChart>
        </ChartContainer>
        {disclaimer ? (
          <p className="text-muted-foreground mt-3 px-2 text-xs leading-relaxed sm:px-6">
            {disclaimer}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
