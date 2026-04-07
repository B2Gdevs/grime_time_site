'use client'

import { useLiveCanvasInteractable } from '@/components/copilot/CopilotInteractable'

export function CanvasViewportInteractable({
  active,
  activeTab,
  dirty,
  pagePath,
  previewMode,
  selectedBlockType,
  selectedIndex,
  selectedLabel,
}: {
  active: boolean
  activeTab: string
  dirty: boolean
  pagePath: string
  previewMode: string
  selectedBlockType: string
  selectedIndex: number
  selectedLabel: string
}) {
  useLiveCanvasInteractable({
    active,
    id: `canvas:${pagePath}`,
    state: {
      activeTab,
      dirty,
      pagePath,
      previewMode,
      selectedBlockType,
      selectedIndex,
      selectedLabel,
    },
  })

  return null
}
