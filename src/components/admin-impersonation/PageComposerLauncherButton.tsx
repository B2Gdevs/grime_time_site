'use client'

import { FilePenLineIcon, PanelLeftOpenIcon } from 'lucide-react'

import { usePageComposerOptional } from '@/components/admin-impersonation/PageComposerContext'
import { Button } from '@/components/ui/button'

export function PageComposerLauncherButton({
  className,
  label = 'Page composer',
  variant = 'ghost',
}: {
  className?: string
  label?: string
  variant?: 'default' | 'ghost' | 'outline' | 'secondary'
}) {
  const composer = usePageComposerOptional()

  if (!composer) {
    return null
  }

  const { close, isOpen, isPanelMinimized, open, setPanelMinimized } = composer

  if (isOpen && isPanelMinimized) {
    return (
      <Button
        className={className}
        onClick={() => setPanelMinimized(false)}
        size="sm"
        type="button"
        variant={variant}
      >
        <PanelLeftOpenIcon className="h-4 w-4" />
        Expand composer
      </Button>
    )
  }

  return (
    <Button
      className={className}
      onClick={isOpen ? close : open}
      size="sm"
      type="button"
      variant={variant}
    >
      <FilePenLineIcon className="h-4 w-4" />
      {isOpen ? 'Close composer' : label}
    </Button>
  )
}
