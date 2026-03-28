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
 * Demo CRM/billing fixtures run by default (`src/endpoints/seed/demo-seed.ts`). To skip them:
 * `npm run seed:baseline` or `SEED_SKIP_DEMO=true npm run seed`.
 *
 * CLI: `grimetime seed push all` (or `push <domain>`); see `src/cli/seed/seed-commands.ts`.
 */
import 'dotenv/config'

import { runSeedScript } from '../src/cli/lib/seed-runner'

void runSeedScript()
  .then((code) => {
    process.exit(code)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
