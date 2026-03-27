import { InfoIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import type { OpsAssetLadderRow } from '@/lib/ops/opsDashboardTypes'

import { truncateText } from './helpers'
import type { DetailState } from './types'

export function AssetsPanel({
  assetLadderItems,
  setDetail,
}: {
  assetLadderItems: OpsAssetLadderRow[]
  setDetail: (value: DetailState) => void
}) {
  return (
    <Card data-tour="portal-assets-panel">
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
  )
}
