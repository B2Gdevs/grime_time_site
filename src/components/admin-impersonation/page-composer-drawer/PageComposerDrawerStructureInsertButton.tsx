'use client'

import { PlusIcon } from 'lucide-react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'

export function PageComposerDrawerStructureInsertButton({
  onClick,
}: {
  onClick: () => void
}) {
  return (
    <button
      aria-label="Add block"
      className="group relative flex h-7 w-full items-center justify-center"
      onClick={onClick}
      type="button"
    >
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border/70 transition group-hover:bg-primary/40" />
      <span className={adminPanelChrome.structureAddCircle}>
        <PlusIcon className="h-4 w-4" />
      </span>
    </button>
  )
}
