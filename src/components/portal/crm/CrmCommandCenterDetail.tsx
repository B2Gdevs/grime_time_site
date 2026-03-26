'use client'

import { ArrowUpRightIcon, InfoIcon } from 'lucide-react'

import type { DetailState } from '@/components/portal/command-center/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { CrmRecordDetail } from '@/lib/crm/workspace'

import { CrmWorkspaceNoteComposer } from './CrmWorkspaceNoteComposer'

function supportsActivityNotes(kind: CrmRecordDetail['kind']): boolean {
  return kind !== 'sequence-definition'
}

export function CrmCommandCenterDetail({
  detail,
  reloadDetail,
  setDetail,
}: {
  detail: CrmRecordDetail
  reloadDetail?: (() => Promise<DetailState | null>) | null
  setDetail: (value: DetailState) => void
}) {
  const hasRelatedContent = detail.relatedSections.some((section) => section.items.length > 0)

  return (
    <div className="grid gap-3">
      <div className="rounded-2xl border bg-muted/20 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold">{detail.title}</p>
              <Badge variant="secondary" className="text-[10px] uppercase">
                {detail.statusLabel}
              </Badge>
              {detail.priorityLabel ? (
                <Badge variant="outline" className="text-[10px] uppercase">
                  {detail.priorityLabel}
                </Badge>
              ) : null}
              {detail.badges.map((badge) => (
                <Badge key={badge} variant="outline" className="text-[10px]">
                  {badge}
                </Badge>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{detail.subtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground"
                    aria-label="CRM detail help"
                    onClick={() =>
                      setDetail({
                        body:
                          'The left rail now shows structured CRM detail so operators can review account context, recent relationships, and log notes without opening overlapping drawers.',
                        description: 'CRM detail rail',
                        kind: 'text',
                        title: 'CRM detail',
                      })
                    }
                  >
                    <InfoIcon className="size-4" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                Summary, related records, and note logging stay in this rail.
              </TooltipContent>
            </Tooltip>

            {detail.href ? (
              <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                <a href={detail.href}>
                  Open record
                  <ArrowUpRightIcon className="size-3.5" />
                </a>
              </Button>
            ) : null}
          </div>
        </div>

        <Tabs defaultValue="summary" className="mt-4 w-full">
          <TabsList className="h-9 w-full justify-start rounded-xl bg-background/80 p-1">
            <TabsTrigger value="summary" className="text-xs">
              Summary
            </TabsTrigger>
            <TabsTrigger value="related" className="text-xs">
              Related
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-3 grid gap-3">
            {detail.description ? (
              <div className="rounded-xl border bg-background/80 p-3 text-sm leading-relaxed text-muted-foreground">
                {detail.description}
              </div>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2">
              {detail.fields.map((field) => (
                <div key={field.label} className="rounded-xl border bg-background/80 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    {field.label}
                  </p>
                  <p className="mt-1 text-sm leading-snug">{field.value}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="related" className="mt-3 grid gap-3">
            {hasRelatedContent ? (
              detail.relatedSections
                .filter((section) => section.items.length > 0)
                .map((section) => (
                  <div key={section.label} className="rounded-xl border bg-background/80 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {section.label}
                    </p>
                    <div className="mt-3 grid gap-2">
                      {section.items.map((item) => (
                        <div key={`${section.label}-${item.kind}-${item.id}`} className="rounded-lg border px-3 py-2">
                          <p className="text-sm font-medium leading-tight">{item.title}</p>
                          {item.meta ? <p className="mt-1 text-xs text-muted-foreground">{item.meta}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
            ) : (
              <div className="rounded-xl border border-dashed bg-background/80 p-4 text-sm text-muted-foreground">
                No related records or activity are linked to this item yet.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {supportsActivityNotes(detail.kind) ? (
        <CrmWorkspaceNoteComposer detail={detail} reloadDetail={reloadDetail} setDetail={setDetail} />
      ) : null}
    </div>
  )
}
