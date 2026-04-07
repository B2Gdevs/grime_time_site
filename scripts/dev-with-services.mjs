import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  buildImageGenCommand,
  imageGenMcpEnabled,
  imageGenVenvExists,
  repoRoot,
  syncImageGenEnvironment,
} from './lib/image-gen-mcp.mjs'
import { applyDevMcpGuards } from './lib/dev-runtime-env.mjs'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

function spawnNodeScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: repoRoot,
      env: process.env,
      stdio: 'inherit',
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`${path.basename(scriptPath)} failed with exit code ${code ?? 'unknown'}.`))
    })
    child.on('error', reject)
  })
}

async function main() {
  await spawnNodeScript(path.join(dirname, 'ensure-single-next-dev.mjs'))

  const { env: guardedEnv, forcedOff } = applyDevMcpGuards(process.env)
  Object.assign(process.env, guardedEnv)
  if (forcedOff) {
    console.log('Grime Time dev: MCP services are forced off for this repo right now.')
  }

  const children = []
  let shuttingDown = false

  async function startImageGenIfEnabled() {
    if (!imageGenMcpEnabled()) {
      return
    }

    if (!imageGenVenvExists()) {
      await syncImageGenEnvironment({ quiet: false })
    }

    const { command, args } = buildImageGenCommand({
      extraArgs: ['--cors'],
      transport: 'streamable-http',
    })

    console.log('Starting image-gen-mcp alongside Next dev...')
    const child = spawn(command, args, {
      cwd: repoRoot,
      env: process.env,
      shell: false,
      stdio: 'inherit',
    })
    children.push(child)
  }

  function shutdown(code = 0) {
    if (shuttingDown) {
      return
    }

    shuttingDown = true
    for (const child of children) {
      if (!child.killed) {
        child.kill('SIGTERM')
      }
    }
    process.exit(code)
  }

  await startImageGenIfEnabled()

  const nextPort = process.env.GT_DEV_PORT?.trim() || '5465'
  const nextChild = spawn(
    process.execPath,
    ['node_modules/next/dist/bin/next', 'dev', '--port', nextPort],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        NODE_OPTIONS: '--no-deprecation',
      },
      stdio: 'inherit',
    },
  )
  children.push(nextChild)

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => shutdown(0))
  }

  nextChild.on('exit', (code) => shutdown(code ?? 0))
  nextChild.on('error', (error) => {
    console.error(error instanceof Error ? error.message : error)
    shutdown(1)
  })
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
