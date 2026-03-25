'use client'

import { useState, useTransition } from 'react'
import { Building2Icon, RefreshCwIcon } from 'lucide-react'

import type { CrmProviderSlug, CrmProviderSummary } from '@/lib/crm/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

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

const ORDER: CrmProviderSlug[] = ['engagebay', 'hubspot']

export function CrmProviderCard(props: Props) {
  const [state, setState] = useState<ResponseState>({
    activeProvider: props.activeProvider,
    availableProviders: props.availableProviders,
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const ordered = ORDER.map((slug) => state.availableProviders.find((p) => p.slug === slug)).filter(
    Boolean,
  ) as CrmProviderSummary[]

  function handleSelect(provider: CrmProviderSlug) {
    startTransition(async () => {
      setErrorMessage(null)

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
        const msg =
          body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
            ? body.error
            : 'Could not switch CRM provider.'

        setErrorMessage(msg)
        return
      }

      setState(body)
    })
  }

  return (
    <Card className="min-w-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2Icon className="size-5" />
          CRM provider
        </CardTitle>
        <CardDescription className="text-xs">Form sync target at runtime.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <ToggleGroup
          className="grid w-full grid-cols-2 gap-0 rounded-lg border bg-muted/40 p-1"
          disabled={isPending}
          onValueChange={(value) => {
            if (value === 'engagebay' || value === 'hubspot') {
              handleSelect(value)
            }
          }}
          type="single"
          value={state.activeProvider ?? undefined}
          variant="outline"
        >
          {ordered.map((provider) => (
            <ToggleGroupItem
              key={provider.slug}
              className="flex-1 rounded-md px-2 text-xs sm:text-sm"
              disabled={!provider.configured || isPending}
              value={provider.slug}
            >
              {provider.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {isPending ? (
            <Badge variant="outline" className="gap-1 font-normal">
              <RefreshCwIcon className="size-3 animate-spin" />
              Saving
            </Badge>
          ) : null}
          {ordered.map((p) => (
            <span key={p.slug}>
              {p.label}
              {p.configured ? '' : ' (not configured)'}
            </span>
          ))}
        </div>

        {errorMessage ? <p className="text-destructive text-sm">{errorMessage}</p> : null}
      </CardContent>
    </Card>
  )
}
