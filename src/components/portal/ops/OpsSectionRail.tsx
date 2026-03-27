import Link from 'next/link'

import { OpsSectionCardContent } from '@/components/portal/ops/OpsSectionCardContent'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { listOpsSectionMeta, type OpsSectionId } from '@/lib/ops/uiMeta'
import { cn } from '@/utilities/ui'

export function OpsSectionRail({ activeSection }: { activeSection: OpsSectionId }) {
  const sections = listOpsSectionMeta()

  return (
    <Card className="h-fit min-w-0 xl:sticky xl:top-[var(--portal-sticky-top)]">
      <CardHeader className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Ops workspace
          </p>
          <CardTitle className="mt-2 text-xl">Focused routes for live work.</CardTitle>
        </div>
        <CardDescription>
          Open one operating surface at a time without stacking overlays on top of the rest of the dashboard.
        </CardDescription>
      </CardHeader>

      <div className="grid gap-2 px-6 pb-6">
        {sections.map((section) => {
          const sectionId = section.href.split('/').at(-1)
          const isActive = sectionId === activeSection

          return (
            <Link
              key={section.href}
              href={section.href}
              className={cn(
                'flex items-start gap-3 rounded-2xl border px-4 py-3 transition-colors',
                isActive ? 'border-border bg-card shadow-sm' : 'border-transparent bg-muted/35 hover:border-border hover:bg-card/70',
              )}
            >
              <OpsSectionCardContent
                description={section.railDescription}
                icon={section.icon}
                label={section.label}
              />
            </Link>
          )
        })}
      </div>
    </Card>
  )
}
