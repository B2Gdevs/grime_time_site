import { getAiOpsAssistantRateLimitMaxRequests, getAiOpsAssistantRateLimitWindowMs } from './config'

type RateLimitBucket = {
  hits: number[]
}

const requestBuckets = new Map<string, RateLimitBucket>()

export function resetCopilotRateLimitState() {
  requestBuckets.clear()
}

export function enforceCopilotRateLimit(key: string) {
  const now = Date.now()
  const windowMs = getAiOpsAssistantRateLimitWindowMs()
  const maxRequests = getAiOpsAssistantRateLimitMaxRequests()
  const bucket = requestBuckets.get(key) ?? { hits: [] }

  bucket.hits = bucket.hits.filter((timestamp) => now - timestamp < windowMs)
  if (bucket.hits.length >= maxRequests) {
    requestBuckets.set(key, bucket)
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - bucket.hits[0])) / 1000)),
    }
  }

  bucket.hits.push(now)
  requestBuckets.set(key, bucket)

  return {
    allowed: true,
    retryAfterSeconds: 0,
  }
}
