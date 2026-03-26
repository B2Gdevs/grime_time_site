import { spawn } from 'node:child_process'

import {
  buildImageGenCommand,
  imageGenVenvExists,
  repoRoot,
  syncImageGenEnvironment,
} from './lib/image-gen-mcp.mjs'

function readOption(name, fallback = null) {
  const index = process.argv.indexOf(name)
  if (index === -1) {
    return fallback
  }

  return process.argv[index + 1] ?? fallback
}

async function main() {
  const transport = readOption('--transport', 'streamable-http')
  const extraArgs = []

  if (transport !== 'stdio' && process.argv.includes('--cors')) {
    extraArgs.push('--cors')
  }

  if (!imageGenVenvExists()) {
    await syncImageGenEnvironment()
  }

  const { command, args } = buildImageGenCommand({
    extraArgs,
    transport,
  })

  const spawned = spawn(command, args, {
    cwd: repoRoot,
    env: process.env,
    shell: false,
    stdio: 'inherit',
  })

  spawned.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
      return
    }

    process.exit(code ?? 0)
  })

  spawned.on('error', (error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
