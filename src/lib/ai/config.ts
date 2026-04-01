import path from 'node:path'

const DEFAULT_CHAT_MODEL = 'gpt-4o-mini'
const DEFAULT_CACHE_PATH = '.cache/ai/ops-doc-rag.json'
const DEFAULT_LOCAL_EMBEDDING_DIMENSIONS = 384
const DEFAULT_LOCAL_EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2'
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 12
const DEFAULT_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000
const DEFAULT_RESULT_LIMIT = 5

function readBooleanEnv(name: string, defaultValue = false): boolean {
  const value = process.env[name]?.trim().toLowerCase()
  if (!value) return defaultValue
  if (['1', 'true', 'yes', 'on'].includes(value)) return true
  if (['0', 'false', 'no', 'off'].includes(value)) return false
  return defaultValue
}

export function isAiOpsAssistantEnabled(): boolean {
  return readBooleanEnv('AI_OPS_ASSISTANT_ENABLED', false)
}

export function isAiOpsAssistantKilled(): boolean {
  return readBooleanEnv('AI_OPS_ASSISTANT_KILL_SWITCH', false)
}

export function isAiOpsAssistantAuditLoggingEnabled(): boolean {
  return readBooleanEnv('AI_OPS_ASSISTANT_AUDIT_LOGGING', true)
}

export function getAiOpsAssistantModel(): string {
  return process.env.AI_OPS_ASSISTANT_MODEL?.trim() || DEFAULT_CHAT_MODEL
}

export function getAiOpsAssistantOpenAiKey(): null | string {
  return (
    process.env.PROVIDERS__OPENAI__API_KEY?.trim()
    || process.env.OPENAI_API_KEY?.trim()
    || null
  )
}

export function getAiOpsAssistantCachePath(): string {
  const explicit = process.env.AI_OPS_ASSISTANT_CACHE_PATH?.trim()
  return path.resolve(process.cwd(), explicit || DEFAULT_CACHE_PATH)
}

export function getAiOpsAssistantEmbeddingModel(): string {
  return process.env.RAG_LOCAL_EMBEDDING_MODEL?.trim() || DEFAULT_LOCAL_EMBEDDING_MODEL
}

export function getAiOpsAssistantEmbeddingDimensions(): number {
  const parsed = Number(process.env.RAG_LOCAL_EMBEDDING_DIMENSIONS?.trim())
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed
  }
  return DEFAULT_LOCAL_EMBEDDING_DIMENSIONS
}

export function getAiOpsAssistantResultLimit(): number {
  const parsed = Number(process.env.AI_OPS_ASSISTANT_RESULT_LIMIT?.trim())
  if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 10) {
    return Math.floor(parsed)
  }
  return DEFAULT_RESULT_LIMIT
}

export function getAiOpsAssistantRateLimitMaxRequests(): number {
  const parsed = Number(process.env.AI_OPS_ASSISTANT_RATE_LIMIT_MAX_REQUESTS?.trim())
  if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 100) {
    return Math.floor(parsed)
  }
  return DEFAULT_RATE_LIMIT_MAX_REQUESTS
}

export function getAiOpsAssistantRateLimitWindowMs(): number {
  const parsed = Number(process.env.AI_OPS_ASSISTANT_RATE_LIMIT_WINDOW_MS?.trim())
  if (Number.isFinite(parsed) && parsed >= 1000 && parsed <= 60 * 60 * 1000) {
    return Math.floor(parsed)
  }
  return DEFAULT_RATE_LIMIT_WINDOW_MS
}
