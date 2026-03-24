import type { ReactNode } from 'react'

import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

export function SiteHeader({
  actions,
  description,
  title,
}: {
  actions?: ReactNode
  description?: string
  title: string
}) {
  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 flex h-14 shrink-0 items-center border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold">{title}</h1>
            {description ? (
              <p className="truncate text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}

