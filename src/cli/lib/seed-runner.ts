import type { Payload } from 'payload'
import { createLocalReq, getPayload } from 'payload'

import { USERS_COLLECTION_SLUG } from '@/collections/Users'
import { isAdminUser } from '@/lib/auth/roles'
import { runSeedPush } from '@/endpoints/seed/orchestrate-push'
import type { User } from '@/payload-types'
import config from '@/payload.config'
import { ALL_SEED_SCOPES, expandScopes, parseSeedDomainArg, type SeedScope } from '@/endpoints/seed/scopes'

import { resolveSeedCredentials } from './seed-credentials'

export { resolveSeedCredentials } from './seed-credentials'

export type RunSeedOptions = {
  /** When true, demo scope is omitted / skipped. */
  baseline?: boolean
  /**
   * Explicit scopes (before dependency expansion). If omitted, uses `domain` or full `ALL_SEED_SCOPES`.
   */
  scopes?: SeedScope[]
  /**
   * Single domain from CLI: `all` | `foundation` | `media` | ...
   */
  domain?: string
}

function resolveScopes(options: RunSeedOptions): SeedScope[] {
  if (options.scopes?.length) {
    return expandScopes(options.scopes)
  }
  if (options.domain) {
    return expandScopes(parseSeedDomainArg(options.domain))
  }
  return expandScopes([...ALL_SEED_SCOPES])
}

/**
 * Same behavior as `scripts/seed.ts`: login as admin, then run Payload seed upserts.
 * @returns exit code (0 = success)
 */
export async function runSeedScript(options?: RunSeedOptions): Promise<number> {
  const baseline =
    Boolean(options?.baseline) || process.env.SEED_SKIP_DEMO === 'true'
  if (baseline) {
    process.env.SEED_SKIP_DEMO = 'true'
  }

  const creds = resolveSeedCredentials()

  if (!creds) {
    console.error(
      'Seed needs one full admin credential pair:\n' +
        '  • SEED_LOGIN_EMAIL + SEED_LOGIN_PASSWORD, or\n' +
        '  • ADMIN_EMAIL + ADMIN_PASSWORD (same as bootstrap:admin)\n' +
        'Or use Payload admin → Seed the database after signing in.',
    )
    return 1
  }

  const { email, password, source } = creds
  if (source === 'admin') {
    console.log('Seed: using ADMIN_EMAIL / ADMIN_PASSWORD (set SEED_LOGIN_* to override).')
  }

  let payload: Payload | undefined

  try {
    payload = await getPayload({ config })

    let resolvedUser: User | null = null

    try {
      const loginResult = await payload.login({
        collection: USERS_COLLECTION_SLUG,
        data: { email, password },
      })
      resolvedUser = (loginResult.user as User | null) ?? null
    } catch {
      const matchedUsers = await payload.find({
        collection: USERS_COLLECTION_SLUG,
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          email: {
            equals: email,
          },
        },
      })

      resolvedUser = (matchedUsers.docs[0] as User | undefined) ?? null
    }

    if (!resolvedUser || !isAdminUser(resolvedUser)) {
      console.error(
        'Seed failed to resolve an admin user. Check ADMIN_* or SEED_LOGIN_* matches an existing admin account.',
      )
      return 1
    }

    const req = await createLocalReq({ user: resolvedUser }, payload)

    const scopes = resolveScopes(options ?? {})
    await runSeedPush({
      payload,
      req,
      scopes,
      skipDemo: baseline,
    })
    console.log('Seed completed successfully.')
    return 0
  } finally {
    if (payload) {
      try {
        await payload.destroy()
      } catch (closeErr) {
        console.error('[seed] payload.destroy() failed (report if process still hangs):', closeErr)
      }
    }
  }
}
