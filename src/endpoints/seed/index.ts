import type { Payload, PayloadRequest } from 'payload'

import { runSeedPush } from './orchestrate-push'
import { ALL_SEED_SCOPES } from './scopes'

export type { SeedScope } from './scopes'
export {
  ALL_SEED_SCOPES,
  SEED_SCOPES,
  SCOPE_DEPS,
  SCOPE_DESCRIPTIONS,
  expandScopes,
  isSeedScope,
  parseSeedDomainArg,
  SEED_SCOPE_ALL,
} from './scopes'
export type { SeedDomainArg } from './scopes'
export { runSeedPush } from './orchestrate-push'
export type { RunSeedPushOptions } from './orchestrate-push'
export * from './expectations'

function logSeedFailure(payload: Payload, err: unknown) {
  const message = err instanceof Error ? err.message : String(err)
  payload.logger.error({ msg: `Seed failed: ${message}`, err })
  const data =
    err && typeof err === 'object' && 'data' in err
      ? (err as { data?: { errors?: unknown } }).data
      : undefined
  if (data?.errors) {
    const serialized = JSON.stringify(data.errors, null, 2)
    payload.logger.error(
      `Payload validation (check seed modules vs field maxRows/required — e.g. hero links vs src/heros/config.ts):\n${serialized}`,
    )
    console.error('Payload validation detail:\n', serialized)
  }
}

export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  try {
    const skipDemo = process.env.SEED_SKIP_DEMO === 'true'
    await runSeedPush({ payload, req, scopes: [...ALL_SEED_SCOPES], skipDemo })
  } catch (err) {
    logSeedFailure(payload, err)
    throw err
  }
}
