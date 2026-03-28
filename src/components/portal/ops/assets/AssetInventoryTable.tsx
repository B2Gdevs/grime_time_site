'use client'

import { InfoIcon, PencilIcon, Trash2Icon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { OpsAssetLadderRow } from '@/lib/ops/opsDashboardTypes'

import { truncateText } from '@/components/portal/command-center/helpers'

export function AssetInventoryTable({
  deletingId,
  items,
  onDelete,
  onEdit,
  onInfo,
}: {
  deletingId: null | string
  items: OpsAssetLadderRow[]
  onDelete: (item: OpsAssetLadderRow) => void
  onEdit: (item: OpsAssetLadderRow) => void
  onInfo: (item: OpsAssetLadderRow) => void
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-4 py-4 text-sm text-muted-foreground">
        No assets tracked yet. Add the pressure washer and any other equipment you actually own, then track future purchases here too.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[13rem]">Asset</TableHead>
            <TableHead className="min-w-[18rem]">Details / spec</TableHead>
            <TableHead className="hidden min-w-[18rem] lg:table-cell">Ops notes</TableHead>
            <TableHead className="w-24">Status</TableHead>
            <TableHead className="w-[9.5rem] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="align-top font-medium">{item.label}</TableCell>
              <TableCell className="align-top text-sm text-muted-foreground">
                {item.buyNotes ? truncateText(item.buyNotes, 120) : '-'}
              </TableCell>
              <TableCell className="hidden align-top text-sm text-muted-foreground lg:table-cell">
                {item.whyNotes ? truncateText(item.whyNotes, 120) : '-'}
              </TableCell>
              <TableCell className="align-top">
                <Badge variant={item.owned ? 'default' : 'secondary'} className="text-[10px]">
                  {item.owned ? 'Have' : 'Want'}
                </Badge>
              </TableCell>
              <TableCell className="align-top">
                <div className="flex items-center justify-end gap-1">
                  <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => onInfo(item)}>
                    <InfoIcon className="size-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => onEdit(item)}>
                    <PencilIcon className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive"
                    disabled={deletingId === item.id}
                    onClick={() => onDelete(item)}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
