'use client'

import { PageComposerDrawer } from '@/components/admin-impersonation/PageComposerDrawer'

export function ContentAuthoringToolbar() {
  return (
    <div className="fixed bottom-5 right-5 z-[65] flex items-center gap-3 rounded-full border border-border/70 bg-background/95 px-4 py-3 shadow-2xl backdrop-blur">
      <div className="hidden sm:block">
        <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Visual editing
        </div>
        <div className="text-sm font-semibold text-foreground">Page composer</div>
      </div>
      <PageComposerDrawer enabled />
    </div>
  )
}
