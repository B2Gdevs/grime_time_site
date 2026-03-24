import 'dotenv/config'

import type { Payload } from 'payload'
import { getPayload } from 'payload'

import config from '../src/payload.config'

async function run(): Promise<void> {
  let payload: Payload | undefined

  try {
    payload = await getPayload({ config })

    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
    const password = process.env.ADMIN_PASSWORD?.trim()
    const name = process.env.ADMIN_NAME?.trim() || 'Site Admin'

    if (!email || !password) {
      throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD before running bootstrap-admin.')
    }

    const existingUsers = await payload.find({
      collection: 'users',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
    })

    if (existingUsers.totalDocs > 0) {
      const match = await payload.find({
        collection: 'users',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: { email: { equals: email } },
      })
      if (match.totalDocs > 0) {
        console.log(
          `Bootstrap skipped: ${email} already has an account. Sign in at /admin (or use GitHub OAuth if configured).`,
        )
      } else {
        console.log(
          `Bootstrap skipped: the database already has Payload user(s). This script only creates the very first admin.\n` +
            `  • Sign in at /admin and invite ${email} from Users, or\n` +
            `  • Remove users you don’t need in Admin → Users, then run this again if you truly need a fresh first user.`,
        )
      }
      return
    }

    await payload.create({
      collection: 'users',
      data: {
        email,
        name,
        password,
        roles: ['admin'],
      },
      overrideAccess: true,
    })

    console.log(`Created initial admin: ${email}`)
  } finally {
    if (payload) {
      try {
        await payload.destroy()
      } catch (closeErr) {
        console.error('[bootstrap-admin] payload.destroy() failed (report if process still hangs):', closeErr)
      }
    }
  }
}

function printError(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error)
  const looksLikeSchema =
    msg.includes('ALTER TABLE') ||
    msg.includes('cannot connect to Postgres') ||
    /relation .* does not exist/i.test(msg)
  if (looksLikeSchema) {
    console.error(msg.slice(0, 2000) + (msg.length > 2000 ? '\n…(truncated)' : ''))
    console.error(
      '\nIf the database is new or migrations were never applied, run: npm run payload migrate\n',
    )
  } else {
    console.error(error)
  }
}

void run()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    printError(error)
    process.exit(1)
  })
