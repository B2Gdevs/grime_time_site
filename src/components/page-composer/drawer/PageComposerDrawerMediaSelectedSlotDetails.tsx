'use client'

import { Button } from '@/components/ui/button'
import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import type { MediaKind, SectionMediaSlot } from '@/components/page-composer/drawer/PageComposerDrawerMediaTypes'
import { formatComposerTimestamp } from '@/utilities/formatComposerTimestamp'

export function PageComposerDrawerMediaSelectedSlotDetails({
  mediaKind,
  selectedMediaSlot,
  setMediaKind,
}: {
  mediaKind: MediaKind
  selectedMediaSlot: SectionMediaSlot
  setMediaKind: (value: 'image' | 'video') => void
}) {
  return (
    <div className={adminPanelChrome.cardGridRounded3xl}>
      <div>
        <div className="text-sm font-semibold text-foreground">{selectedMediaSlot.label}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {selectedMediaSlot.media?.alt || 'Use the library gallery, upload, or generate to fill this slot.'}
        </div>
      </div>
      <div className="grid gap-2 text-xs text-muted-foreground">
        <div>
          Current file: <span className="text-foreground">{selectedMediaSlot.media?.filename || 'None'}</span>
        </div>
        <div>
          Last updated: <span className="text-foreground">{formatComposerTimestamp(selectedMediaSlot.media?.updatedAt)}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setMediaKind('image')} size="sm" type="button" variant={mediaKind === 'image' ? 'default' : 'outline'}>
          Image
        </Button>
        <Button onClick={() => setMediaKind('video')} size="sm" type="button" variant={mediaKind === 'video' ? 'default' : 'outline'}>
          Video
        </Button>
      </div>
    </div>
  )
}

