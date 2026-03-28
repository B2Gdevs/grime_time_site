#!/usr/bin/env node
/**
 * Shim: run the TypeScript CLI via tsx from this package root (works with npm link / npx / local bin).
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const tsxCli = path.join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs')
const entry = path.join(root, 'src', 'cli', 'grimetime.ts')

if (!fs.existsSync(tsxCli)) {
  console.error('grimetime: tsx not found. Run npm install from the grime_time_site repository root.')
  process.exit(1)
}

const result = spawnSync(process.execPath, [tsxCli, entry, ...process.argv.slice(2)], {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: [process.env.NODE_OPTIONS, '--no-deprecation'].filter(Boolean).join(' '),
  },
})

process.exit(result.status ?? 1)
