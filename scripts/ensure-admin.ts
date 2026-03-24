/**
 * Create or reset a Payload admin user in Postgres (bypasses access control).
 *
 * This does NOT use Supabase Authentication (dashboard “Users”). Payload stores
 * admins in the `users` table in the same database as POSTGRES_URL.
 *
 * Use when GitHub OAuth fails, seeded logins (e.g. bg@…) don’t work, or you need
 * a known password for /admin email login.
 *
 *   ADMIN_EMAIL=you@domain.com ADMIN_PASSWORD='a-strong-password' npm run admin:ensure
 */
import 'dotenv/config'

import type { Payload } from 'payload'
import { getPayload } from 'payload'

import { USERS_COLLECTION_SLUG } from '../src/collections/Users'
import config from '../src/payload.config'

async function run(): Promise<number> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD?.trim()
  const name = process.env.ADMIN_NAME?.trim() || 'Site Admin'

  if (!email || !password) {
    console.error(
      'Set ADMIN_EMAIL and ADMIN_PASSWORD.\n' +
        'Example: ADMIN_EMAIL=you@company.com ADMIN_PASSWORD=\'…\' npm run admin:ensure',
    )
    return 1
  }

  let payload: Payload | undefined

  try {
    payload = await getPayload({ config })

    const found = await payload.find({
      collection: USERS_COLLECTION_SLUG,
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      pagination: false,
    })

    const existing = found.docs[0]

    if (existing) {
      await payload.update({
        collection: USERS_COLLECTION_SLUG,
        id: existing.id,
        data: {
          password,
          roles: ['admin'],
          ...(name ? { name } : {}),
        },
        overrideAccess: true,
      })
      console.log(`Updated admin: ${email} (password reset, roles set to admin). Sign in at /admin with email + password.`)
    } else {
      await payload.create({
        collection: USERS_COLLECTION_SLUG,
        data: {
          email,
          name,
          password,
          roles: ['admin'],
        },
        overrideAccess: true,
      })
      console.log(`Created admin: ${email}. Sign in at /admin with email + password.`)
    }

    return 0
  } finally {
    if (payload) {
      try {
        await payload.destroy()
      } catch (e) {
        console.error('[admin:ensure] payload.destroy() failed:', e)
      }
    }
  }
}

void run()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
