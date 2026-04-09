'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CopyPlusIcon,
  EyeIcon,
  EyeOffIcon,
  GripVerticalIcon,
  InfoIcon,
  RefreshCcwIcon,
  Trash2Icon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { PageComposerSectionSummary } from '@/lib/pages/pageComposer'

export function PageComposerDrawerSortableSectionRow({
  active,
  canMoveDown = false,
  canMoveUp = false,
  disableSorting = false,
  onClick,
  onDuplicate,
  onMoveDown,
  onMoveUp,
  onRemove,
  onReplace,
  onToggleHidden,
  summary,
}: {
  active: boolean
  canMoveDown?: boolean
  canMoveUp?: boolean
  disableSorting?: boolean
  onClick: () => void
  onDuplicate: () => void
  onMoveDown?: () => void
  onMoveUp?: () => void
  onRemove: () => void
  onReplace: () => void
  onToggleHidden: () => void
  summary: PageComposerSectionSummary
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: summary.identity,
    disabled: disableSorting,
  })

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border px-3 py-3.5 transition ${
        active ? 'border-primary/60 bg-primary/5 shadow-sm' : 'border-border/70 bg-card/50'
      } ${summary.hidden ? 'opacity-75' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <div className="flex items-start gap-3">
        <button
          aria-label={`Drag ${summary.label}`}
          className="mt-0.5 rounded-lg border border-border/70 bg-background p-2 text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:cursor-default disabled:opacity-50"
          disabled={disableSorting}
          type="button"
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="h-4 w-4" />
        </button>
        <button className="min-w-0 flex-1 text-left" onClick={onClick} type="button">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{summary.label}</span>
            <Badge variant="outline">{summary.blockType}</Badge>
            {summary.variant ? <Badge variant="secondary">{summary.variant}</Badge> : null}
            {summary.badges
              .filter((badge) => badge !== summary.variant)
              .map((badge) => (
                <Badge key={badge} variant={badge === 'reusable' ? 'secondary' : 'outline'}>
                  {badge}
                </Badge>
              ))}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{summary.description}</div>
        </button>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          <Button
            aria-label={`Move block ${summary.label} up`}
            disabled={!canMoveUp}
            onClick={onMoveUp}
            size="icon"
            type="button"
            variant="ghost"
          >
            <ArrowUpIcon className="h-4 w-4" />
          </Button>
          <Button
            aria-label={`Move block ${summary.label} down`}
            disabled={!canMoveDown}
            onClick={onMoveDown}
            size="icon"
            type="button"
            variant="ghost"
          >
            <ArrowDownIcon className="h-4 w-4" />
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button aria-label={`Block help for ${summary.label}`} size="icon" type="button" variant="ghost">
                <InfoIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[240px] text-xs leading-snug" side="left">
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{summary.label}</p>
                <p>{summary.description}</p>
                <p>{summary.category === 'dynamic' ? 'Code-owned app block.' : 'Page-local content block.'}</p>
              </div>
            </TooltipContent>
          </Tooltip>
          <Button aria-label={`Replace block ${summary.label}`} onClick={onReplace} size="icon" type="button" variant="ghost">
            <RefreshCcwIcon className="h-4 w-4" />
          </Button>
          <Button
            aria-label={`${summary.hidden ? 'Show' : 'Hide'} block ${summary.label}`}
            onClick={onToggleHidden}
            size="icon"
            type="button"
            variant="ghost"
          >
            {summary.hidden ? <EyeIcon className="h-4 w-4" /> : <EyeOffIcon className="h-4 w-4" />}
          </Button>
          <Button aria-label={`Duplicate block ${summary.label}`} onClick={onDuplicate} size="icon" type="button" variant="ghost">
            <CopyPlusIcon className="h-4 w-4" />
          </Button>
          <Button aria-label={`Delete block ${summary.label}`} onClick={onRemove} size="icon" type="button" variant="ghost">
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
