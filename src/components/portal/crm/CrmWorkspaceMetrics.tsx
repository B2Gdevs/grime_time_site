import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { CrmWorkspaceMetric } from '@/lib/crm/workspace'

function badgeVariant(tone: CrmWorkspaceMetric['tone']): 'default' | 'destructive' | 'secondary' {
  switch (tone) {
    case 'warning':
      return 'destructive'
    case 'positive':
      return 'secondary'
    default:
      return 'default'
  }
}

export function CrmWorkspaceMetrics({ metrics }: { metrics: CrmWorkspaceMetric[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {metrics.map((metric) => (
        <Card key={metric.label} className="min-w-0">
          <CardContent className="flex h-full flex-col gap-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {metric.label}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{metric.value}</p>
              </div>
              <Badge variant={badgeVariant(metric.tone)} className="shrink-0 text-[10px] uppercase">
                {metric.tone}
              </Badge>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{metric.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
