/**
 * Idempotent seed (upsert): same as admin "Seed the database" / POST /next/seed.
 * Creates or updates baseline docs by slug/filename/email; does not wipe the database.
 * Requires an admin login because seed touches protected collections.
 *
 * Credentials (use **one** complete pair — same as `npm run bootstrap:admin`):
 * 1. `SEED_LOGIN_EMAIL` + `SEED_LOGIN_PASSWORD`, or
 * 2. `ADMIN_EMAIL` + `ADMIN_PASSWORD` if seed vars are unset (typical after bootstrap).
 *
 * Loads `.env` from the project root via dotenv (see package.json script).
 *
 * Optional: `DEMO_SEED=true` also upserts demo CRM/billing personas (`src/endpoints/seed/demo-seed.ts`) — dev/staging only.
 */
import 'dotenv/config'

import type { Payload } from 'payload'
import { createLocalReq, getPayload } from 'payload'

import { USERS_COLLECTION_SLUG } from '../src/collections/Users'
import { isAdminUser } from '../src/lib/auth/roles'
import type { User } from '../src/payload-types'
import { seed } from '../src/endpoints/seed'
import config from '../src/payload.config'

function resolveSeedCredentials():
  | { email: string; password: string; source: 'admin' | 'seed' }
  | null {
  const seedEmail = process.env.SEED_LOGIN_EMAIL?.trim().toLowerCase()
  const seedPassword = process.env.SEED_LOGIN_PASSWORD?.trim()
  if (seedEmail && seedPassword) {
    return { email: seedEmail, password: seedPassword, source: 'seed' }
  }
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const adminPassword = process.env.ADMIN_PASSWORD?.trim()
  if (adminEmail && adminPassword) {
    return { email: adminEmail, password: adminPassword, source: 'admin' }
  }
  return null
}

async function run(): Promise<number> {
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

    await seed({ payload, req })
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

void run()
  .then((code) => {
    process.exit(code)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
