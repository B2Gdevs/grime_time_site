'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { PageComposerCanvasMode } from '@/components/page-composer/PageComposerContext'

import { CanvasViewportModeMenuItem } from './CanvasViewportModeMenuItem'
import { canvasViewportModeOptions } from './CanvasViewportModeOptions'
import { CanvasViewportModeTrigger } from './CanvasViewportModeTrigger'

export function CanvasViewportModeStrip({
  activeMode,
  onSetMode,
}: {
  activeMode: PageComposerCanvasMode
  onSetMode: (mode: PageComposerCanvasMode) => void
}) {
  const active = canvasViewportModeOptions.find((option) => option.mode === activeMode) ?? canvasViewportModeOptions[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <CanvasViewportModeTrigger active={active} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Canvas width</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {canvasViewportModeOptions.map((option) => (
          <CanvasViewportModeMenuItem activeMode={activeMode} key={option.mode} onSetMode={onSetMode} option={option} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
