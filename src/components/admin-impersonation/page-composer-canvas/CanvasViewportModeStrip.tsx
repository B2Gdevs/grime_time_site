'use client'

import { MonitorIcon, SmartphoneIcon, TabletSmartphoneIcon } from 'lucide-react'

import { CanvasModeButton } from './CanvasPrimitives'
import type { PageComposerCanvasMode } from '@/components/admin-impersonation/PageComposerContext'

export function CanvasViewportModeStrip({
  activeMode,
  onSetMode,
}: {
  activeMode: PageComposerCanvasMode
  onSetMode: (mode: PageComposerCanvasMode) => void
}) {
  return (
    <>
      <CanvasModeButton
        active={activeMode === 'desktop'}
        icon={<MonitorIcon className="h-4 w-4" />}
        label="Desktop preview"
        onClick={() => onSetMode('desktop')}
      />
      <CanvasModeButton
        active={activeMode === 'tablet'}
        icon={<TabletSmartphoneIcon className="h-4 w-4" />}
        label="Tablet preview"
        onClick={() => onSetMode('tablet')}
      />
      <CanvasModeButton
        active={activeMode === 'mobile'}
        icon={<SmartphoneIcon className="h-4 w-4" />}
        label="Mobile preview"
        onClick={() => onSetMode('mobile')}
      />
    </>
  )
}
