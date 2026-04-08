'use client'

import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'
import { CopyPlusIcon, EyeIcon, EyeOffIcon, GripVerticalIcon, PlusIcon, Trash2Icon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { PageComposerSectionSummary } from '@/lib/pages/pageComposer'

export function PageComposerDrawerSortableSectionRow({
  active,
  onAddBelow,
  onClick,
  onDuplicate,
  onRemove,
  onToggleHidden,
  summary,
}: {
  active: boolean
  onAddBelow: () => void
  onClick: () => void
  onDuplicate: () => void
  onRemove: () => void
  onToggleHidden: () => void
  summary: PageComposerSectionSummary
}) {
  const isHeroSummary = summary.blockType === 'hero'
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: String(summary.index),
    disabled: isHeroSummary,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-2xl border p-3 transition ${
        active ? 'border-primary/60 bg-primary/5' : 'border-border/70 bg-card/50'
      } ${summary.hidden ? 'opacity-75' : ''}`}
    >
      <div className="flex items-start gap-3">
        <button
          className="mt-0.5 rounded-lg border border-border/70 bg-background p-2 text-muted-foreground disabled:cursor-default disabled:opacity-50"
          disabled={isHeroSummary}
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
        <div className="flex shrink-0 gap-2">
          <Button aria-label={`Add block below ${summary.label}`} onClick={onAddBelow} size="icon" type="button" variant="ghost">
            <PlusIcon className="h-4 w-4" />
          </Button>
          {!isHeroSummary ? (
            <>
              <Button
                aria-label={`${summary.hidden ? 'Show' : 'Hide'} block ${summary.label}`}
                onClick={onToggleHidden}
                size="icon"
                type="button"
                variant="ghost"
              >
                {summary.hidden ? <EyeIcon className="h-4 w-4" /> : <EyeOffIcon className="h-4 w-4" />}
              </Button>
              <Button onClick={onDuplicate} size="icon" type="button" variant="ghost">
                <CopyPlusIcon className="h-4 w-4" />
              </Button>
              <Button onClick={onRemove} size="icon" type="button" variant="ghost">
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}


