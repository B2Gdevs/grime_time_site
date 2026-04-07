'use client'

import { SparklesIcon } from 'lucide-react'
import { useCallback } from 'react'

import { usePageComposerOptional } from '@/components/admin-impersonation/PageComposerContext'
import { usePortalCopilotOptional } from '@/components/copilot/PortalCopilotContext'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/utilities/ui'

function SparkleInlineButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      aria-label="Generate text for this field"
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-background/92 text-primary shadow-sm transition hover:border-primary/50 hover:bg-primary/10"
      data-page-composer-interactive="true"
      onClick={onClick}
      type="button"
    >
      <SparklesIcon className="h-4 w-4" />
    </button>
  )
}

export function InlineTextInput({
  className,
  onChange,
  onGenerate,
  placeholder,
  value,
}: {
  className?: string
  onChange: (value: string) => void
  onGenerate?: () => void
  placeholder?: string
  value: string
}) {
  return (
    <div className="relative" data-page-composer-interactive="true">
      <Input
        className={cn('pr-11', className)}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
      {onGenerate ? (
        <div className="absolute inset-y-0 right-1 flex items-center">
          <SparkleInlineButton onClick={onGenerate} />
        </div>
      ) : null}
    </div>
  )
}

export function InlineTextarea({
  className,
  onChange,
  onGenerate,
  placeholder,
  rows = 3,
  value,
}: {
  className?: string
  onChange: (value: string) => void
  onGenerate?: () => void
  placeholder?: string
  rows?: number
  value: string
}) {
  return (
    <div className="relative" data-page-composer-interactive="true">
      <Textarea
        className={cn('pr-11', className)}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        value={value}
      />
      {onGenerate ? (
        <div className="absolute right-1 top-1">
          <SparkleInlineButton onClick={onGenerate} />
        </div>
      ) : null}
    </div>
  )
}

export function usePageComposerTextGenerator() {
  const composer = usePageComposerOptional()
  const copilot = usePortalCopilotOptional()

  return useCallback((args: {
    applyText?: (value: string) => void
    currentText?: string
    fieldLabel: string
    fieldPath: string
    instructions?: string
  }) => {
    composer?.setActiveTab('content')
    copilot?.openFocusedTextSession(args)
  }, [composer, copilot])
}
