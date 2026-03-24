import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export type SectionCardItem = {
  description: string
  footer: string
  tone?: 'down' | 'up'
  trend: string
  title: string
  value: string
}

export function SectionCards({ items }: { items: SectionCardItem[] }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {items.map((item) => {
        const TrendIcon = item.tone === 'down' ? TrendingDownIcon : TrendingUpIcon

        return (
          <Card className="@container/card min-w-0" key={item.title}>
            <CardHeader className="relative">
              <CardDescription>{item.title}</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                {item.value}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                  <TrendIcon className="size-3" />
                  {item.trend}
                </Badge>
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {item.description} <TrendIcon className="size-4" />
              </div>
              <div className="text-muted-foreground">{item.footer}</div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
