'use client'

import { PlusIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utilities/ui'

export function CanvasModeButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          className="h-10 w-10 rounded-xl"
          onClick={onClick}
          size="icon"
          type="button"
          variant={active ? 'default' : 'outline'}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

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

export function CanvasInsertHandle({
  align,
  hidden = false,
  onClick,
}: {
  align: 'bottom' | 'top'
  hidden?: boolean
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}) {
  if (hidden) {
    return null
  }

  return (
    <button
      aria-label={align === 'top' ? 'Add block above' : 'Add block below'}
      className={cn(adminPanelChrome.canvasBlockInsertHandle, align === 'top' ? '-top-4' : '-bottom-4')}
      data-page-composer-interactive="true"
      onClick={onClick}
      type="button"
    >
      <PlusIcon className="h-4 w-4" />
    </button>
  )
}

export function CanvasToolbarField({
  className,
  icon,
  onChange,
  placeholder,
  value,
}: {
  className?: string
  icon: ReactNode
  onChange: (value: string) => void
  placeholder: string
  value: string
}) {
  return (
    <div className={cn('relative', className)}>
      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">{icon}</div>
      <Input className="h-10 pl-10" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
    </div>
  )
}
