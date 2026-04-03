import crypto from 'node:crypto'

import { isAiOpsAssistantAuditLoggingEnabled } from './config'

type CopilotAuditEvent = {
  currentPath?: string
  elapsedMs?: number
  event:
    | 'copilot_blocked_disabled'
    | 'copilot_blocked_kill_switch'
    | 'copilot_blocked_rate_limit'
    | 'copilot_completed'
    | 'copilot_rejected_bad_query'
    | 'copilot_rejected_unauthorized'
  messageCount?: number
  query?: string
  queryHash?: string
  requestId?: string
  sourceCount?: number
  userEmail?: string
  userId?: null | number | string
}

function hashQuery(query: string | undefined): string | undefined {
  if (!query?.trim()) return undefined
  return crypto.createHash('sha256').update(query.trim()).digest('hex').slice(0, 12)
}

export function logCopilotAudit(event: CopilotAuditEvent) {
  if (!isAiOpsAssistantAuditLoggingEnabled()) return

  const payload = {
    currentPath: event.currentPath,
    elapsedMs: event.elapsedMs,
    event: event.event,
    messageCount: event.messageCount,
    queryHash: event.queryHash || hashQuery(event.query),
    requestId: event.requestId,
    sourceCount: event.sourceCount,
    userEmail: event.userEmail,
    userId: event.userId ?? null,
  }

  console.info('[ai-ops-copilot]', JSON.stringify(payload))
}
