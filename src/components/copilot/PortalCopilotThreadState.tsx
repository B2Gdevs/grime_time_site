'use client'

import { AssistantCloud } from '@assistant-ui/react'
import { useMemo } from 'react'

import { getAssistantCloudBaseUrl } from '@/lib/ai/assistantCloud'

async function fetchAssistantCloudToken() {
  const response = await fetch('/api/internal/assistant-cloud/token', {
    method: 'POST',
  })

  const payload = (await response.json().catch(() => null)) as null | { error?: string; token?: string }

  if (!response.ok || !payload?.token) {
    throw new Error(payload?.error || 'Unable to initialize assistant cloud.')
  }

  return payload.token
}

export function useAssistantCloudClient() {
  const baseUrl = getAssistantCloudBaseUrl()

  return useMemo(() => {
    if (!baseUrl) {
      return null
    }

    return new AssistantCloud({
      authToken: fetchAssistantCloudToken,
      baseUrl,
    })
  }, [baseUrl])
}
