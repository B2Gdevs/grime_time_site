import crypto from 'node:crypto'

type LogLevel = 'error' | 'info' | 'warn'

type LoggerMethod = (message: string, data?: Record<string, unknown>) => void

type ObservabilityLogger = {
  error: LoggerMethod
  info: LoggerMethod
  warn: LoggerMethod
}

export type RequestTrace = {
  method: string
  pathname: string
  requestId: string
  route: string
  startedAtMs: number
}

export function createRequestTrace(request: Request, route: string): RequestTrace {
  return {
    method: request.method.toUpperCase(),
    pathname: normalizePathname(new URL(request.url).pathname),
    requestId: request.headers.get('x-request-id')?.trim() || crypto.randomUUID(),
    route,
    startedAtMs: Date.now(),
  }
}

export function withRequestIdHeader<T extends Response>(response: T, requestId: string): T {
  response.headers.set('x-request-id', requestId)
  return response
}

export function logRequestStart(
  trace: RequestTrace,
  summary?: Record<string, unknown>,
  logger: ObservabilityLogger = defaultLogger,
) {
  emitLog(logger, 'info', `${trace.route} request started`, {
    method: trace.method,
    pathname: trace.pathname,
    requestId: trace.requestId,
    summary,
  })
}

export function logRequestSuccess(
  trace: RequestTrace,
  status: number,
  summary?: Record<string, unknown>,
  logger: ObservabilityLogger = defaultLogger,
) {
  emitLog(logger, 'info', `${trace.route} request completed`, {
    durationMs: Date.now() - trace.startedAtMs,
    method: trace.method,
    pathname: trace.pathname,
    requestId: trace.requestId,
    status,
    summary,
  })
}

export function logRequestFailure(
  trace: RequestTrace,
  status: number,
  error?: unknown,
  summary?: Record<string, unknown>,
  logger: ObservabilityLogger = defaultLogger,
) {
  emitLog(logger, status >= 500 ? 'error' : 'warn', `${trace.route} request failed`, {
    durationMs: Date.now() - trace.startedAtMs,
    error: summarizeError(error),
    method: trace.method,
    pathname: trace.pathname,
    requestId: trace.requestId,
    status,
    summary,
  })
}

export function summarizeContactRequest(values: {
  message: string
  phone: string
  preferredReply: string
  propertyAddress: string
  requestedService: string
}) {
  return {
    hasPhone: hasText(values.phone),
    hasPropertyAddress: hasText(values.propertyAddress),
    messageLength: values.message.trim().length,
    preferredReply: values.preferredReply,
    requestedService: values.requestedService,
  }
}

export function summarizeInstantQuoteRequest(values: {
  address: string
  condition: string
  details: string
  frequency: string
  phone: string
  requestScheduling: boolean
  scheduleApproximateSize: string
  schedulingNotes: string
  schedulingPreferredWindow?: string
  schedulingPropertyType?: string
  serviceKey: string
  sqft: string
  stories: string
}) {
  return {
    condition: values.condition,
    frequency: values.frequency,
    hasAddress: hasText(values.address),
    hasDetails: hasText(values.details),
    hasPhone: hasText(values.phone),
    hasScheduleApproximateSize: hasText(values.scheduleApproximateSize),
    hasSchedulingNotes: hasText(values.schedulingNotes),
    requestScheduling: values.requestScheduling,
    schedulingPreferredWindow: values.requestScheduling ? values.schedulingPreferredWindow ?? null : null,
    schedulingPropertyType: values.requestScheduling ? values.schedulingPropertyType ?? null : null,
    serviceKey: values.serviceKey,
    sqftBucket: bucketNumericString(values.sqft),
    stories: values.stories,
  }
}

export function summarizeScheduleRequest(values: {
  approximateSize: string
  notes: string
  preferredWindow: string
  propertyAddress: string
  propertyType: string
  requestedService: string
  targetDate: string
}) {
  return {
    hasApproximateSize: hasText(values.approximateSize),
    hasNotes: hasText(values.notes),
    hasPropertyAddress: hasText(values.propertyAddress),
    hasTargetDate: hasText(values.targetDate),
    preferredWindow: values.preferredWindow,
    propertyType: values.propertyType,
    requestedService: values.requestedService,
  }
}

export function summarizeCopilotRequest(body: {
  authoringContext?: unknown
  currentPath?: string
  focusedSession?: { mode?: unknown } | null
  messages?: Array<{ content?: unknown; role?: unknown }>
}) {
  const conversation = Array.isArray(body.messages) ? body.messages : []
  const latestUserMessage = [...conversation]
    .reverse()
    .find((message) => message?.role === 'user' && typeof message.content === 'string')

  return {
    currentPath: typeof body.currentPath === 'string' ? normalizePathname(body.currentPath) : null,
    focusedSessionMode:
      typeof body.focusedSession?.mode === 'string' ? body.focusedSession.mode : null,
    hasAuthoringContext: Boolean(body.authoringContext),
    latestUserQueryLength:
      typeof latestUserMessage?.content === 'string' ? latestUserMessage.content.trim().length : 0,
    messageCount: conversation.length,
  }
}

function bucketNumericString(raw: string) {
  const parsed = Number.parseFloat(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) return 'unknown'
  if (parsed < 1000) return '<1000'
  if (parsed < 2500) return '1000-2499'
  if (parsed < 5000) return '2500-4999'
  if (parsed < 10000) return '5000-9999'
  return '10000+'
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function normalizePathname(pathname: string) {
  if (!pathname) return '/'
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }
  return pathname
}

function summarizeError(error: unknown) {
  if (!error) return undefined
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
    }
  }
  return {
    value: String(error),
  }
}

function emitLog(
  logger: ObservabilityLogger,
  level: LogLevel,
  message: string,
  data: Record<string, unknown>,
) {
  logger[level](`[grimetime][observability][${level}] ${message}`, compactLogData(data))
}

function compactLogData(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => typeof value !== 'undefined'))
}

const defaultLogger: ObservabilityLogger = {
  error(message, data) {
    console.error(message, data)
  },
  info(message, data) {
    console.info(message, data)
  },
  warn(message, data) {
    console.warn(message, data)
  },
}
