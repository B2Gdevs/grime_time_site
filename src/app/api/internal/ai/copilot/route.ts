import { userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import { requirePayloadUser } from '@/lib/auth/requirePayloadUser'
import {
  AI_OPS_ASSISTANT_INSTRUCTIONS,
  buildCopilotInsights,
  buildCopilotAuthoringSystemMessage,
  buildOpsRagSystemMessage,
  createCopilotChatCompletion,
  enforceCopilotRateLimit,
  getAiOpsAssistantModel,
  getAiOpsAssistantOpenAiKey,
  isAiOpsAssistantEnabled,
  isAiOpsAssistantKilled,
  logCopilotAudit,
  sanitizeCopilotAuthoringContext,
  sanitizeCopilotFocusedSession,
  searchOpsRag,
  type CopilotAuthoringContext,
  type CopilotApiResponse,
  type CopilotConversationMessage,
  type CopilotFocusedSession,
} from '@/lib/ai'
import {
  createRequestTrace,
  logRequestFailure,
  logRequestStart,
  logRequestSuccess,
  summarizeCopilotRequest,
  withRequestIdHeader,
} from '@/lib/observability'

export const runtime = 'nodejs'

type CopilotRequestBody = {
  authoringContext?: CopilotAuthoringContext
  currentPath?: string
  focusedSession?: CopilotFocusedSession
  modelContextSystem?: string
  messages?: Array<{ content?: unknown; role?: unknown }>
}

function normalizeConversation(messages: CopilotRequestBody['messages']): CopilotConversationMessage[] {
  return (messages ?? [])
    .map((message) => {
      if (!message) return null
      const role = message.role
      const content = typeof message.content === 'string' ? message.content.trim() : ''
      if (!content) return null
      if (role !== 'assistant' && role !== 'system' && role !== 'user') return null
      return {
        content,
        role,
      } satisfies CopilotConversationMessage
    })
    .filter((message): message is CopilotConversationMessage => Boolean(message))
    .slice(-12)
}

function latestUserQuery(messages: CopilotConversationMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message.role === 'user' && message.content.trim()) {
      return message.content.trim()
    }
  }
  return ''
}

export async function POST(request: Request) {
  const trace = createRequestTrace(request, 'internal.ai.copilot')
  const startedAt = trace.startedAtMs
  logRequestStart(trace)
  if (!isAiOpsAssistantEnabled()) {
    logCopilotAudit({
      event: 'copilot_blocked_disabled',
      requestId: trace.requestId,
    })
    logRequestFailure(trace, 503, undefined, {
      reason: 'feature_disabled',
    })
    return withRequestIdHeader(
      Response.json(
        { error: 'The Grime Time employee copilot is currently disabled.' },
        { status: 503 },
      ),
      trace.requestId,
    )
  }

  if (isAiOpsAssistantKilled()) {
    logCopilotAudit({
      event: 'copilot_blocked_kill_switch',
      requestId: trace.requestId,
    })
    logRequestFailure(trace, 503, undefined, {
      reason: 'kill_switch',
    })
    return withRequestIdHeader(
      Response.json(
        { error: 'The Grime Time employee copilot is temporarily unavailable.' },
        { status: 503 },
      ),
      trace.requestId,
    )
  }

  const auth = await requirePayloadUser(request)
  if (!auth || !userIsAdmin(auth.user)) {
    logCopilotAudit({
      event: 'copilot_rejected_unauthorized',
      requestId: trace.requestId,
    })
    logRequestFailure(trace, 401, undefined, {
      reason: 'unauthorized',
    })
    return withRequestIdHeader(Response.json({ error: 'Unauthorized' }, { status: 401 }), trace.requestId)
  }

  const apiKey = getAiOpsAssistantOpenAiKey()
  if (!apiKey) {
    logRequestFailure(trace, 503, undefined, {
      reason: 'missing_openai_key',
      userId: auth.realUser.id,
    })
    return withRequestIdHeader(
      Response.json({ error: 'OpenAI is not configured for the employee copilot.' }, { status: 503 }),
      trace.requestId,
    )
  }

  const body = (await request.json().catch(() => null)) as CopilotRequestBody | null
  const requestSummary = summarizeCopilotRequest(body ?? {})
  const conversation = normalizeConversation(body?.messages)
  const authoringContext = sanitizeCopilotAuthoringContext(body?.authoringContext)
  const focusedSession = sanitizeCopilotFocusedSession(body?.focusedSession)
  const modelContextSystem = typeof body?.modelContextSystem === 'string' ? body.modelContextSystem.trim() : ''
  const authoringSystemMessage = buildCopilotAuthoringSystemMessage({
    authoringContext,
    focusedSession,
  })
  const query = latestUserQuery(conversation)

  if (!query) {
    logCopilotAudit({
      currentPath: body?.currentPath,
      event: 'copilot_rejected_bad_query',
      messageCount: conversation.length,
      requestId: trace.requestId,
      userEmail: auth.realUser.email ?? undefined,
      userId: auth.realUser.id,
    })
    logRequestFailure(trace, 400, undefined, {
      ...requestSummary,
      reason: 'empty_query',
      userId: auth.realUser.id,
    })
    return withRequestIdHeader(
      Response.json({ error: 'Ask a question before starting a copilot turn.' }, { status: 400 }),
      trace.requestId,
    )
  }

  const rateLimit = enforceCopilotRateLimit(`copilot:${auth.realUser.id}`)
  if (!rateLimit.allowed) {
    logCopilotAudit({
      currentPath: body?.currentPath,
      event: 'copilot_blocked_rate_limit',
      messageCount: conversation.length,
      query,
      requestId: trace.requestId,
      userEmail: auth.realUser.email ?? undefined,
      userId: auth.realUser.id,
    })
    logRequestFailure(trace, 429, undefined, {
      ...requestSummary,
      retryAfterSeconds: rateLimit.retryAfterSeconds,
      userId: auth.realUser.id,
    })
    return withRequestIdHeader(
      Response.json(
        { error: 'Employee copilot is temporarily rate-limited for this user. Please wait a moment and try again.' },
        {
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
          },
          status: 429,
        },
      ),
      trace.requestId,
    )
  }

  const [sources, insights] = await Promise.all([
    searchOpsRag(query),
    buildCopilotInsights({
      currentPath: body?.currentPath,
      isRealAdmin: userIsAdmin(auth.realUser),
      payload: auth.payload,
      query,
      user: auth.realUser,
    }),
  ])

  const ragSystemMessage = buildOpsRagSystemMessage(sources)
  const completion = await createCopilotChatCompletion({
    apiKey,
    messages: [
      {
        content: AI_OPS_ASSISTANT_INSTRUCTIONS,
        role: 'system',
      },
      ...(ragSystemMessage
        ? [
            {
              content: ragSystemMessage,
              role: 'system' as const,
            },
          ]
        : []),
      {
        content: `Operator context:\n- Name: ${insights.operator.name}\n- Email: ${insights.operator.email}\n- Open tasks assigned to this operator: ${insights.tasks.length}\n- Immediate follow-up items assigned to this operator: ${insights.followUps.length}`,
        role: 'system',
      },
      ...(authoringSystemMessage
        ? [
            {
              content: authoringSystemMessage,
              role: 'system' as const,
            },
          ]
        : []),
      ...(modelContextSystem
        ? [
            {
              content: modelContextSystem,
              role: 'system' as const,
            },
          ]
        : []),
      ...conversation,
    ],
    model: getAiOpsAssistantModel(),
    signal: request.signal,
  })

  const response: CopilotApiResponse = {
    insights,
    model: getAiOpsAssistantModel(),
    query,
    sources,
    text: completion || 'I could not produce an answer from the current Grime Time context.',
  }

  logCopilotAudit({
    currentPath: body?.currentPath,
    elapsedMs: Date.now() - startedAt,
    event: 'copilot_completed',
    messageCount: conversation.length,
    query,
    requestId: trace.requestId,
    sourceCount: sources.length,
    userEmail: auth.realUser.email ?? undefined,
    userId: auth.realUser.id,
  })

  logRequestSuccess(trace, 200, {
    ...requestSummary,
    sourceCount: sources.length,
    userId: auth.realUser.id,
  })

  return withRequestIdHeader(Response.json(response), trace.requestId)
}
