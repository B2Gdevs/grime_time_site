'use client'

import { useState, useTransition } from 'react'
import { Building2Icon, RefreshCwIcon } from 'lucide-react'

import type { CrmProviderSlug, CrmProviderSummary } from '@/lib/crm/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
  activeProvider: CrmProviderSlug | null
  availableProviders: CrmProviderSummary[]
}

type ResponseState = {
  activeProvider: CrmProviderSlug | null
  availableProviders: CrmProviderSummary[]
}

function isResponseState(value: unknown): value is ResponseState {
  if (!value || typeof value !== 'object') return false

  return 'activeProvider' in value && 'availableProviders' in value
}

export function CrmProviderCard(props: Props) {
  const [state, setState] = useState<ResponseState>({
    activeProvider: props.activeProvider,
    availableProviders: props.availableProviders,
  })
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const configuredProviders = state.availableProviders.filter((provider) => provider.configured)

  function handleSelect(provider: CrmProviderSlug) {
    startTransition(async () => {
      setMessage(null)

      const response = await fetch('/api/internal/crm-provider', {
        body: JSON.stringify({ provider }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const body = (await response.json().catch(() => null)) as
        | ResponseState
        | { error?: string }
        | null

      if (!response.ok || !isResponseState(body)) {
        const errorMessage =
          body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
            ? body.error
            : 'Could not switch CRM provider.'

        setMessage(errorMessage)
        return
      }

      setState(body)
      setMessage(`Active CRM provider: ${body.activeProvider}`)
    })
  }

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2Icon className="size-5" />
          CRM provider
        </CardTitle>
        <CardDescription>
          Lead forms write to the active provider at runtime. Keep EngageBay live now and switch to HubSpot later without rewiring the form stack.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          {state.availableProviders.map((provider) => {
            const isActive = state.activeProvider === provider.slug
            return (
              <Button
                key={provider.slug}
                type="button"
                variant={isActive ? 'default' : 'outline'}
                disabled={!provider.configured || isPending}
                onClick={() => handleSelect(provider.slug)}
              >
                {provider.label}
                {provider.configured ? null : ' (not configured)'}
              </Button>
            )
          })}
        </div>

        <div className="rounded-lg border p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2 font-medium">
            <span>Runtime state</span>
            <Badge variant="outline">
              {state.activeProvider ? `Active: ${state.activeProvider}` : 'No active provider'}
            </Badge>
            {isPending ? (
              <Badge variant="outline" className="gap-1">
                <RefreshCwIcon className="size-3 animate-spin" />
                Saving
              </Badge>
            ) : null}
          </div>
          <p className="mt-2 text-muted-foreground">
            Configured providers: {configuredProviders.length > 0 ? configuredProviders.map((provider) => provider.label).join(', ') : 'none'}
          </p>
          <p className="mt-1 text-muted-foreground">
            This toggle is persisted in the app runtime state, not in Payload schema, so it stays migration-free.
          </p>
          {message ? <p className="mt-2 text-foreground">{message}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}
