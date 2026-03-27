import fs from 'node:fs'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'

import { ensureImageGenMcpRepoPresent, ensureUvAvailable, imageGenMcpDir, imageGenVenvExists, repoRoot } from './lib/image-gen-mcp.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootEnvPath = path.join(repoRoot, '.env')
const cursorConfigPath = path.join(repoRoot, '.cursor', 'mcp.json')
const payloadCodexExamplePath = path.join(repoRoot, '.codex', 'payload-mcp.example.toml')
const imageCodexExamplePath = path.join(repoRoot, '.codex', 'image-gen-mcp.example.toml')
const payloadLauncherPath = path.join(repoRoot, 'scripts', 'payload-mcp-stdio.mjs')
const imageLauncherPath = path.join(repoRoot, 'scripts', 'image-gen-mcp-start.mjs')

dotenv.config({ path: rootEnvPath })

function result(status, label, detail) {
  return { detail, label, status }
}

function formatResult(entry) {
  const prefix =
    entry.status === 'pass' ? '[pass]' : entry.status === 'warn' ? '[warn]' : '[fail]'

  return `${prefix} ${entry.label}: ${entry.detail}`
}

function fileExists(filePath) {
  return fs.existsSync(filePath)
}

async function verifyPayloadMcp() {
  const results = []
  const payloadUrl = process.env.PAYLOAD_MCP_URL?.trim() || 'http://localhost:5465/api/mcp'
  const payloadApiKey = process.env.PAYLOAD_MCP_API_KEY?.trim()
  const payloadEnabled = process.env.PAYLOAD_MCP_ENABLED === 'true'

  results.push(
    fileExists(payloadLauncherPath)
      ? result('pass', 'payload launcher', 'scripts/payload-mcp-stdio.mjs exists')
      : result('fail', 'payload launcher', 'Missing scripts/payload-mcp-stdio.mjs'),
  )

  results.push(
    payloadEnabled
      ? result('pass', 'payload env gate', 'PAYLOAD_MCP_ENABLED=true')
      : result('fail', 'payload env gate', 'Set PAYLOAD_MCP_ENABLED=true in .env to expose /api/mcp'),
  )

  results.push(
    payloadApiKey
      ? result('pass', 'payload api key', 'PAYLOAD_MCP_API_KEY is present')
      : result('fail', 'payload api key', 'Create a Payload MCP API key in admin and store it as PAYLOAD_MCP_API_KEY'),
  )

  if (!payloadEnabled || !payloadApiKey) {
    return results
  }

  try {
    const response = await fetch(payloadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${payloadApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(5000),
    })

    if (response.status === 404) {
      results.push(result('fail', 'payload endpoint', `${payloadUrl} returned 404`))
      return results
    }

    if (response.status === 401 || response.status === 403) {
      results.push(result('fail', 'payload endpoint', `${payloadUrl} rejected the MCP API key (${response.status})`))
      return results
    }

    results.push(
      result(
        'pass',
        'payload endpoint',
        `${payloadUrl} responded with ${response.status}; endpoint is reachable and auth was accepted`,
      ),
    )
  } catch (error) {
    results.push(
      result(
        'fail',
        'payload endpoint',
        `Unable to reach ${payloadUrl}: ${error instanceof Error ? error.message : String(error)}`,
      ),
    )
  }

  return results
}

function verifyCursorAndCodexConfig() {
  const results = []

  if (!fileExists(cursorConfigPath)) {
    results.push(result('fail', 'cursor config', 'Missing .cursor/mcp.json'))
    return results
  }

  try {
    const cursorConfig = JSON.parse(fs.readFileSync(cursorConfigPath, 'utf8'))
    const payloadConfig = cursorConfig?.mcpServers?.payload_local
    const imageConfig = cursorConfig?.mcpServers?.image_gen_local

    results.push(
      payloadConfig?.command === 'node' && Array.isArray(payloadConfig.args)
        ? result('pass', 'cursor payload_local', '.cursor/mcp.json contains payload_local')
        : result('fail', 'cursor payload_local', 'Add payload_local to .cursor/mcp.json'),
    )
    results.push(
      imageConfig?.command === 'node' && Array.isArray(imageConfig.args)
        ? result('pass', 'cursor image_gen_local', '.cursor/mcp.json contains image_gen_local')
        : result('fail', 'cursor image_gen_local', 'Add image_gen_local to .cursor/mcp.json'),
    )
  } catch (error) {
    results.push(
      result(
        'fail',
        'cursor config',
        `Unable to parse .cursor/mcp.json: ${error instanceof Error ? error.message : String(error)}`,
      ),
    )
  }

  results.push(
    fileExists(payloadCodexExamplePath)
      ? result('pass', 'codex payload example', '.codex/payload-mcp.example.toml exists')
      : result('fail', 'codex payload example', 'Missing .codex/payload-mcp.example.toml'),
  )
  results.push(
    fileExists(imageCodexExamplePath)
      ? result('pass', 'codex image example', '.codex/image-gen-mcp.example.toml exists')
      : result('fail', 'codex image example', 'Missing .codex/image-gen-mcp.example.toml'),
  )

  return results
}

async function verifyImageGenMcp() {
  const results = []

  try {
    ensureImageGenMcpRepoPresent()
    results.push(result('pass', 'image-gen repo', `Vendored repo present at ${path.relative(repoRoot, imageGenMcpDir)}`))
  } catch (error) {
    results.push(result('fail', 'image-gen repo', error instanceof Error ? error.message : String(error)))
    return results
  }

  try {
    ensureUvAvailable()
    results.push(result('pass', 'uv', '`uv` is available'))
  } catch (error) {
    results.push(result('fail', 'uv', error instanceof Error ? error.message : String(error)))
  }

  results.push(
    imageGenVenvExists()
      ? result('pass', 'image-gen venv', 'vendor/image-gen-mcp/.venv exists')
      : result('fail', 'image-gen venv', 'Run `npm run image-mcp:setup` to create the vendored Python environment'),
  )

  results.push(
    fileExists(imageLauncherPath)
      ? result('pass', 'image-gen launcher', 'scripts/image-gen-mcp-start.mjs exists')
      : result('fail', 'image-gen launcher', 'Missing scripts/image-gen-mcp-start.mjs'),
  )

  if (!imageGenVenvExists() || !fileExists(imageLauncherPath)) {
    return results
  }

  const launchResult = await new Promise((resolve) => {
    const child = spawn('node', ['scripts/image-gen-mcp-start.mjs', '--transport', 'stdio'], {
      cwd: repoRoot,
      env: process.env,
      shell: false,
      stdio: 'ignore',
    })

    let settled = false

    const finish = (entry) => {
      if (settled) {
        return
      }

      settled = true
      clearTimeout(timer)
      resolve(entry)
    }

    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      finish(result('pass', 'image-gen stdio', 'image_gen_local launcher started successfully'))
    }, 2500)

    child.on('error', (error) => {
      finish(
        result(
          'fail',
          'image-gen stdio',
          `Unable to launch image_gen_local: ${error instanceof Error ? error.message : String(error)}`,
        ),
      )
    })

    child.on('exit', (code) => {
      if (settled) {
        return
      }

      finish(
        code === 0
          ? result('pass', 'image-gen stdio', 'image_gen_local exited cleanly')
          : result('fail', 'image-gen stdio', `image_gen_local exited before startup completed (code ${code ?? 'unknown'})`),
      )
    })
  })

  results.push(launchResult)

  return results
}

function verifyNodeTools() {
  const results = []
  const npxVersion =
    process.platform === 'win32'
      ? spawnSync('cmd', ['/c', 'npx', '--version'], {
          cwd: repoRoot,
          shell: false,
          stdio: 'ignore',
        })
      : spawnSync('npx', ['--version'], {
          cwd: repoRoot,
          shell: false,
          stdio: 'ignore',
        })

  results.push(
    npxVersion.status === 0
      ? result('pass', 'npx', '`npx` is available for payload_local stdio bridging')
      : result('fail', 'npx', '`npx` is required for scripts/payload-mcp-stdio.mjs'),
  )

  return results
}

async function main() {
  const groups = [
    ...verifyNodeTools(),
    ...verifyCursorAndCodexConfig(),
    ...(await verifyPayloadMcp()),
    ...(await verifyImageGenMcp()),
  ]

  for (const entry of groups) {
    console.log(formatResult(entry))
  }

  const failures = groups.filter((entry) => entry.status === 'fail')

  if (failures.length > 0) {
    process.exit(1)
  }

  console.log('[pass] mcp readiness: payload_local and image_gen_local verification checks passed')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
