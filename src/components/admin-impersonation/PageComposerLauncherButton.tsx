'use client'

import { FilePenLineIcon } from 'lucide-react'

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

  return (
    <Button
      className={className}
      onClick={composer.isOpen ? composer.close : composer.open}
      size="sm"
      type="button"
      variant={variant}
    >
      <FilePenLineIcon className="h-4 w-4" />
      {composer.isOpen ? 'Close composer' : label}
    </Button>
  )
}
