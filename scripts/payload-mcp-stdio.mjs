/**
 * Stdio MCP bridge for Cursor/Codex: spawns mcp-remote with Authorization from .env
 * so `.cursor/mcp.json` does not need a committed API key.
 *
 * Requires: `PAYLOAD_MCP_API_KEY` in repo root `.env` (create in Payload Admin when MCP is enabled).
 * Dev server: `http://localhost:5465/api/mcp` with `PAYLOAD_MCP_ENABLED=true`.
 */
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(repoRoot, '.env') })

const key = process.env.PAYLOAD_MCP_API_KEY?.trim()
if (!key) {
  console.error(
    '[payload-mcp-stdio] Set PAYLOAD_MCP_API_KEY in .env (Payload Admin → MCP API keys after PAYLOAD_MCP_ENABLED=true).',
  )
  process.exit(1)
}

const url = process.env.PAYLOAD_MCP_URL?.trim() || 'http://localhost:5465/api/mcp'

const child = spawn(
  'npx',
  ['-y', 'mcp-remote', url, '--header', `Authorization: Bearer ${key}`],
  {
    cwd: repoRoot,
    shell: true,
    stdio: 'inherit',
  },
)

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  process.exit(code ?? 0)
})
