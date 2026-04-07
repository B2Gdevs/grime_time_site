'use client'

export function CanvasSectionSelectionChip({
  isSelected,
  label,
  sectionBadgeLabel,
}: {
  isSelected: boolean
  label: string
  sectionBadgeLabel: string
}) {
  return (
    <div
      className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-2 rounded-full border border-border/70 bg-background/94 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-foreground shadow-lg opacity-0 backdrop-blur transition group-hover:opacity-100 group-focus-within:opacity-100 data-[selected=true]:opacity-0"
      data-selected={isSelected ? 'true' : 'false'}
    >
      <span className="text-primary">{sectionBadgeLabel}</span>
      <span className="text-muted-foreground">/</span>
      <span className="text-foreground">{label}</span>
    </div>
  )
}
