'use client'

import type { ReactNode } from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/utilities/ui'

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
