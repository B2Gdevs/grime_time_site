export { logCopilotAudit } from './audit'
export { AI_OPS_ASSISTANT_INSTRUCTIONS, buildOpsRagSystemMessage } from './chat-context'
export {
  getAiOpsAssistantRateLimitMaxRequests,
  getAiOpsAssistantRateLimitWindowMs,
  isAiOpsAssistantAuditLoggingEnabled,
  getAiOpsAssistantCachePath,
  getAiOpsAssistantEmbeddingDimensions,
  getAiOpsAssistantEmbeddingModel,
  getAiOpsAssistantModel,
  getAiOpsAssistantOpenAiKey,
  isAiOpsAssistantEnabled,
  isAiOpsAssistantKilled,
} from './config'
export { createCopilotChatCompletion } from './client'
export {
  buildCopilotAuthoringSystemMessage,
  sanitizeCopilotAuthoringContext,
  sanitizeCopilotFocusedSession,
} from './copilotAuthoring'
export { buildCopilotInsights } from './ops-context'
export { enforceCopilotRateLimit, resetCopilotRateLimitState } from './rate-limit'
export { searchOpsRag, warmOpsRagIndex } from './rag'
export type {
  CopilotAuthoringContext,
  CopilotApiResponse,
  CopilotConversationMessage,
  CopilotFocusedSession,
  CopilotFocusedSessionMode,
  CopilotInsightBundle,
  CopilotRagHit,
  CopilotTourSuggestion,
} from './types'
