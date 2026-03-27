'use client'

import { useQueryClient } from '@tanstack/react-query'
import { FlaskConicalIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { queryKeys } from '@/lib/query/queryKeys'
import { useDemoMode } from '@/providers/DemoModeProvider'

export function DemoModeToggle() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { demoMode, setDemoMode } = useDemoMode()

  return (
    <Button
      className="gap-1.5"
      onClick={() => {
        setDemoMode(!demoMode)
        void queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'crm-workspace' })
        void queryClient.invalidateQueries({ queryKey: queryKeys.billingWorkspace })
        router.refresh()
      }}
      size="sm"
      title="When on, /ops and CRM show only @demo.grimetime.local fixtures; enables tours for admins."
      type="button"
      variant={demoMode ? 'default' : 'outline'}
    >
      <FlaskConicalIcon className="h-4 w-4" />
      Demo data {demoMode ? 'on' : 'off'}
    </Button>
  )
}
