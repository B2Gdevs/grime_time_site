/**
 * Grime Time CLI entry — must chdir to repo root and load `.env` before any Payload imports.
 * @see package.json `bin.grimetime`
 */
import path from 'node:path'

import { config as loadEnv } from 'dotenv'

import { resolveRepoRoot } from './lib/repo-root'

async function bootstrap(): Promise<void> {
  const root = resolveRepoRoot()
  process.chdir(root)
  loadEnv({ path: path.join(root, '.env') })

  const { runGrimetimeMain } = await import('./run-main')
  await runGrimetimeMain()
}

void bootstrap().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
