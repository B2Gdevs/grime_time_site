import type { CrmWorkspaceQueueItem } from '@/lib/crm/workspace'
import type { OpsSectionId } from '@/lib/ops/uiMeta'

export type CopilotConversationMessage = {
  content: string
  role: 'assistant' | 'system' | 'user'
}

export type CopilotRagHit = {
  chunkId: string
  content: string
  heading: null | string
  score: number
  slug: string
  sourcePath: string
  title: string
}

export type CopilotTourSuggestion = {
  id: string
  label: string
  blurb: string
  opsTab?: OpsSectionId
  path: string
}

export type CopilotInsightBundle = {
  followUps: CrmWorkspaceQueueItem[]
  operator: {
    email: string
    isRealAdmin: boolean
    name: string
  }
  query: string
  recommendedTours: CopilotTourSuggestion[]
  tasks: CrmWorkspaceQueueItem[]
}

export type CopilotApiResponse = {
  insights: CopilotInsightBundle
  model: string
  query: string
  sources: CopilotRagHit[]
  text: string
}
