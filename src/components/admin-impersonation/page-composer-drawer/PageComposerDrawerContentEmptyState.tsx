'use client'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'

export function PageComposerDrawerContentEmptyState({
  children,
}: {
  children: string
}) {
  return <div className={adminPanelChrome.panelEmptyMuted}>{children}</div>
}
