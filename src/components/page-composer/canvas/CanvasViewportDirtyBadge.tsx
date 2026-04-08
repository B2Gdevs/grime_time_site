'use client'

import { Badge } from '@/components/ui/badge'

export function CanvasViewportDirtyBadge({
  dirty,
}: {
  dirty: boolean
}) {
  if (!dirty) {
    return null
  }

  return (
    <div className="pointer-events-none absolute left-1/2 top-full z-10 -translate-x-1/2 -translate-y-1/2">
      <Badge className="rounded-full px-3 py-1 shadow-lg" variant="default">
        Unsaved
      </Badge>
    </div>
  )
}
