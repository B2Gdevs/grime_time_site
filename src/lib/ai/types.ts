import type { CrmWorkspaceQueueItem } from '@/lib/crm/workspace'
import type { OpsSectionId } from '@/lib/ops/uiMeta'

export type CopilotConversationMessage = {
  content: string
  role: 'assistant' | 'system' | 'user'
}

export type CopilotFocusedSessionMode = 'gallery' | 'image' | 'video'

export type CopilotAuthoringContext = {
  mediaSlot?: {
    label: string
    mediaId: null | number
    mimeType?: null | string
    relationPath: string
  } | null
  page?: {
    id: number
    pagePath: string
    slug: string
    status: 'draft' | 'published'
    title: string
    visibility: 'private' | 'public'
  } | null
  section?: {
    blockType: string
    description: string
    index: number
    label: string
    variant?: null | string
  } | null
  surface: 'page-composer'
}

export type CopilotFocusedSession = {
  mode: CopilotFocusedSessionMode | null
  promptHint?: string
  type: 'media-generation'
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
