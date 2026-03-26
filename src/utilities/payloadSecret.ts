import { createHash } from 'crypto'

function stableFallbackSeed() {
  return [
    process.env.POSTGRES_URL?.trim() || '',
    process.env.NEXT_PUBLIC_SERVER_URL?.trim() || '',
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || '',
    process.env.VERCEL_URL?.trim() || '',
    'grime-time-payload-fallback',
  ].join('|')
}

export function resolvePayloadSecret(): string {
  const configured = process.env.PAYLOAD_SECRET?.trim()

  if (configured) {
    return configured
  }

  return createHash('sha256').update(stableFallbackSeed()).digest('hex')
}

export function isUsingFallbackPayloadSecret(): boolean {
  return !process.env.PAYLOAD_SECRET?.trim()
}
