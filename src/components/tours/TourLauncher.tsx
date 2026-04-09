'use client'

import { RouteIcon } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { parseOpsTabQuery } from '@/lib/ops/opsCommandCenterTabs'
import { OPS_DASHBOARD_PATH } from '@/lib/navigation/portalPaths'
import type { OpsSectionId } from '@/lib/ops/uiMeta'
import { listToursByAudience, portalTourRegistry, type PortalTourId } from '@/lib/tours/registry'

import { usePortalTour } from './PortalTourProvider'
import { useToursEnabled } from './ToursEnabledContext'

function effectiveOpsTab(searchParams: URLSearchParams): OpsSectionId {
  return parseOpsTabQuery(searchParams.get('tab') ?? undefined) ?? 'today'
}

export function TourLauncher({ isRealAdmin }: { isRealAdmin: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { startTour } = usePortalTour()
  const toursEnabled = useToursEnabled()

  const staffTours = listToursByAudience('staff')
  const customerTours = listToursByAudience('customer')

  if (!toursEnabled) {
    return null
  }

  const launch = (id: PortalTourId) => {
    const def = portalTourRegistry[id]

    if (def.opsTab) {
      const normalized = effectiveOpsTab(searchParams)
      if (pathname === '/ops/workspace' && normalized === def.opsTab) {
        startTour(id)
        return
      }
      router.push(`/ops/workspace?tab=${def.opsTab}&tour=${id}`)
      return
    }

    if (def.path === OPS_DASHBOARD_PATH) {
      if (pathname === OPS_DASHBOARD_PATH) startTour(id)
      else router.push(`${OPS_DASHBOARD_PATH}?tour=${id}`)
      return
    }

    if (pathname === def.path) startTour(id)
    else router.push(`${def.path}?tour=${id}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="w-full justify-start gap-2"
          data-tour="portal-tour-launcher"
          size="sm"
          type="button"
          variant="outline"
        >
          <RouteIcon className="size-4 shrink-0" />
          Guided tours
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[min(100vw-2rem,22rem)]">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Step-by-step — replay anytime from here
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Customer (homeowner / account)
        </DropdownMenuLabel>
        {customerTours.map((t) => (
          <DropdownMenuItem key={t.id} className="flex flex-col items-start gap-0.5 py-2" onSelect={() => launch(t.id)}>
            <span className="font-medium leading-none">{t.label}</span>
            <span className="text-xs font-normal text-muted-foreground">{t.blurb}</span>
          </DropdownMenuItem>
        ))}

        {isRealAdmin ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Staff / field team
            </DropdownMenuLabel>
            {staffTours.map((t) => (
              <DropdownMenuItem
                key={t.id}
                className="flex flex-col items-start gap-0.5 py-2"
                onSelect={() => launch(t.id)}
              >
                <span className="font-medium leading-none">{t.label}</span>
                <span className="text-xs font-normal text-muted-foreground">{t.blurb}</span>
              </DropdownMenuItem>
            ))}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
