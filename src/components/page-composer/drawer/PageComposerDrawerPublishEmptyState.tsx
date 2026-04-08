'use client'

import type { ReactNode } from 'react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'

export function PageComposerDrawerPublishEmptyState({
  children,
}: {
  children: ReactNode
}) {
  return <div className={adminPanelChrome.panelEmptyMuted}>{children}</div>
}
