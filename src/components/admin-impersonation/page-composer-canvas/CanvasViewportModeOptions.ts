import { MonitorIcon, SmartphoneIcon, TabletSmartphoneIcon } from 'lucide-react'

import type { PageComposerCanvasMode } from '@/components/admin-impersonation/PageComposerContext'

export type CanvasViewportModeOption = {
  description: string
  icon: typeof MonitorIcon
  label: string
  mode: PageComposerCanvasMode
  widthLabel: string
}

export const canvasViewportModeOptions: CanvasViewportModeOption[] = [
  {
    mode: 'desktop',
    label: 'Desktop',
    description: 'Full-width layout in the canvas',
    widthLabel: '100%',
    icon: MonitorIcon,
  },
  {
    mode: 'tablet',
    label: 'Tablet',
    description: 'Medium breakpoint preview',
    widthLabel: 'max 52rem',
    icon: TabletSmartphoneIcon,
  },
  {
    mode: 'mobile',
    label: 'Mobile',
    description: 'Narrow single-column preview',
    widthLabel: 'max 26rem',
    icon: SmartphoneIcon,
  },
]
