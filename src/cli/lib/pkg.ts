import fs from 'node:fs'
import path from 'node:path'

import { REPO_ROOT_FROM_CLI } from './repo-root'

/** Version from this package's `package.json` (resolved via CLI file location). */
export function getCliPackageVersion(): string {
  try {
    const raw = fs.readFileSync(path.join(REPO_ROOT_FROM_CLI, 'package.json'), 'utf8')
    const pkg = JSON.parse(raw) as { version?: string }
    return pkg.version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
}
