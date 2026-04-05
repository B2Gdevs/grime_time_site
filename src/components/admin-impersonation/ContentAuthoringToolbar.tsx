'use client'

import { PageComposerDrawer } from '@/components/admin-impersonation/PageComposerDrawer'

export function ContentAuthoringToolbar() {
  return (
    <div className="fixed right-0 top-1/2 z-[65] -translate-y-1/2">
      <div className="flex items-center gap-3 rounded-l-2xl border border-r-0 border-border/70 bg-background/95 px-4 py-4 shadow-2xl backdrop-blur">
        <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Visual editing
        </div>
        <div className="hidden sm:block text-sm font-semibold text-foreground">Page composer</div>
        <PageComposerDrawer enabled />
      </div>
    </div>
  )
}
