import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const EXPECTED_PACKAGE_NAME = 'grime_time_site'

/** Directory containing this file: `src/cli/lib` */
const CLI_LIB_DIR = path.dirname(fileURLToPath(import.meta.url))

/** Repo root when resolved from CLI source location (`src/cli` → two levels up). */
export const REPO_ROOT_FROM_CLI = path.resolve(CLI_LIB_DIR, '..', '..', '..')

function readPackageName(dir: string): string | null {
  const pkgPath = path.join(dir, 'package.json')
  if (!fs.existsSync(pkgPath)) return null
  try {
    const raw = fs.readFileSync(pkgPath, 'utf8')
    const pkg = JSON.parse(raw) as { name?: string }
    return typeof pkg.name === 'string' ? pkg.name : null
  } catch {
    return null
  }
}

/**
 * Walk from `startDir` upward looking for `package.json` with name `grime_time_site`
 * (same idea as git discovering the repo from cwd).
 */
export function findRepoRootFrom(startDir: string): string | null {
  let current = path.resolve(startDir)
  const { root } = path.parse(current)
  while (true) {
    const name = readPackageName(current)
    if (name === EXPECTED_PACKAGE_NAME) return current
    if (current === root) break
    current = path.dirname(current)
  }
  return null
}

/**
 * Prefer cwd-based discovery; fall back to CLI location so `grimetime` works when invoked
 * from a linked global install while still targeting this package root.
 */
export function resolveRepoRoot(): string {
  const fromCwd = findRepoRootFrom(process.cwd())
  if (fromCwd) return fromCwd
  const fromCli = findRepoRootFrom(REPO_ROOT_FROM_CLI)
  if (fromCli) return fromCli
  throw new Error(
    `grimetime: not inside the ${EXPECTED_PACKAGE_NAME} repository (no matching package.json in parent directories). ` +
      `Run this command from a clone of the Grime Time site, or npm link this package from its root.`,
  )
}
