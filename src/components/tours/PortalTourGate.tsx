'use client'

import type { ReactNode } from 'react'

import { useDemoMode } from '@/providers/DemoModeProvider'
import { isPortalTourEnabled } from '@/lib/demo/tourAccess'

import { PortalTourProvider } from './PortalTourProvider'
import { ToursEnabledProvider } from './ToursEnabledContext'

export function PortalTourGate({
  children,
  effectiveUserEmail,
  isRealAdmin,
}: {
  children: ReactNode
  effectiveUserEmail: string
  isRealAdmin: boolean
}) {
  const { demoMode } = useDemoMode()
  const toursEnabled = isPortalTourEnabled({
    demoMode,
    effectiveEmail: effectiveUserEmail,
    isRealAdmin,
  })

  return (
    <ToursEnabledProvider enabled={toursEnabled}>
      <PortalTourProvider isRealAdmin={isRealAdmin} toursEnabled={toursEnabled}>
        {children}
      </PortalTourProvider>
    </ToursEnabledProvider>
  )
}
