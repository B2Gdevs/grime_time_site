import type { LucideIcon } from 'lucide-react'

export function OpsSectionCardContent({
  description,
  icon: Icon,
  label,
}: {
  description: string
  icon: LucideIcon
  label: string
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="shrink-0 rounded-lg border bg-background/80 p-2 text-primary">
        <Icon className="size-4" />
      </span>
      <span className="grid min-w-0 flex-1 gap-1 overflow-hidden">
        <span className="break-words font-mono text-[13px] font-semibold tracking-tight">{label}</span>
        <span className="break-words text-xs leading-5 text-muted-foreground">{description}</span>
      </span>
    </div>
  )
}
