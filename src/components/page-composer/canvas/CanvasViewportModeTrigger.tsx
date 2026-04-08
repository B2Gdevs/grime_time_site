'use client'

import { ChevronDownIcon } from 'lucide-react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'

import type { CanvasViewportModeOption } from './CanvasViewportModeOptions'

export function CanvasViewportModeTrigger({ active }: { active: CanvasViewportModeOption }) {
  const ActiveIcon = active.icon

  return (
    <Button
      aria-expanded="false"
      aria-haspopup="menu"
      className={cn(
        adminPanelChrome.segmentedControlBar,
        'h-10 gap-2 px-3 font-normal hover:bg-card/80',
      )}
      type="button"
      variant="outline"
    >
      <ActiveIcon aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 truncate text-left text-sm">
        <span className="text-muted-foreground">Preview size</span>
        <span className="mx-1.5 text-border">·</span>
        <span className="font-medium text-foreground">{active.label}</span>
      </span>
      <ChevronDownIcon aria-hidden className="h-4 w-4 shrink-0 opacity-60" />
    </Button>
  )
}
