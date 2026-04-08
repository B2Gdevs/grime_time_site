'use client'

import { CheckIcon } from 'lucide-react'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

import type { CanvasViewportModeOption } from './CanvasViewportModeOptions'

export function CanvasViewportModeMenuItem({
  activeMode,
  onSetMode,
  option,
}: {
  activeMode: CanvasViewportModeOption['mode']
  onSetMode: (mode: CanvasViewportModeOption['mode']) => void
  option: CanvasViewportModeOption
}) {
  const Icon = option.icon
  const selected = option.mode === activeMode

  return (
    <DropdownMenuItem
      className="cursor-pointer flex-col items-stretch gap-0.5 py-2.5"
      onSelect={(event) => {
        event.preventDefault()
        onSetMode(option.mode)
      }}
    >
      <span className="flex w-full items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <span className="font-medium">{option.label}</span>
          <span className="text-xs tabular-nums text-muted-foreground">{option.widthLabel}</span>
        </span>
        {selected ? (
          <CheckIcon aria-hidden className="h-4 w-4 shrink-0 text-primary" />
        ) : (
          <span className="h-4 w-4 shrink-0" />
        )}
      </span>
      <span className="pl-6 text-xs text-muted-foreground">{option.description}</span>
    </DropdownMenuItem>
  )
}
