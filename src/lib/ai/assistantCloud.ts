import { AssistantCloud } from 'assistant-cloud'

const DEFAULT_WORKSPACE_ID = 'grimetime'

export function getAssistantCloudBaseUrl() {
  const value = process.env.NEXT_PUBLIC_ASSISTANT_BASE_URL?.trim()
  return value ? value : null
}

export function getAssistantCloudApiKey() {
  const value = process.env.ASSISTANT_API_KEY?.trim()
  return value ? value : null
}

export function getAssistantCloudWorkspaceId() {
  const value = process.env.ASSISTANT_WORKSPACE_ID?.trim()
  return value ? value : DEFAULT_WORKSPACE_ID
}

export function assistantCloudEnabled() {
  return Boolean(getAssistantCloudBaseUrl() && getAssistantCloudApiKey())
}

export function createAssistantCloudServerClient(userId: string) {
  const apiKey = getAssistantCloudApiKey()

  if (!apiKey) {
    return null
  }

  return new AssistantCloud({
    apiKey,
    userId,
    workspaceId: getAssistantCloudWorkspaceId(),
  })
}
