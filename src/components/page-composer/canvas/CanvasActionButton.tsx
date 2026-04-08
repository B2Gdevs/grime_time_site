'use client'

import type { ReactNode } from 'react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utilities/ui'

export function CanvasActionButton({
  children,
  className,
  label,
  onClick,
}: {
  children: ReactNode
  className?: string
  label: string
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          data-page-composer-interactive="true"
          aria-label={label}
          className={cn(adminPanelChrome.canvasToolbarIconButton, className)}
          onClick={onClick}
          type="button"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
