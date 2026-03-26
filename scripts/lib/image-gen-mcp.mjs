import fs from 'node:fs'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const repoRoot = path.resolve(dirname, '..', '..')
export const imageGenMcpDir = path.join(repoRoot, 'vendor', 'image-gen-mcp')
export const rootEnvPath = path.join(repoRoot, '.env')

export function imageGenMcpEnabled() {
  return process.env.IMAGE_GEN_MCP_ENABLED === 'true'
}

export function ensureImageGenMcpRepoPresent() {
  const pyprojectPath = path.join(imageGenMcpDir, 'pyproject.toml')

  if (!fs.existsSync(pyprojectPath)) {
    throw new Error(
      'Missing vendor/image-gen-mcp. Run `git submodule update --init --recursive vendor/image-gen-mcp`.',
    )
  }
}

export function ensureUvAvailable() {
  const result = spawnSync('uv', ['--version'], {
    cwd: repoRoot,
    shell: false,
    stdio: 'ignore',
  })

  if (result.status !== 0) {
    throw new Error('`uv` is required for image-gen-mcp. Install uv before using this workflow.')
  }
}

export function imageGenVenvExists() {
  return fs.existsSync(path.join(imageGenMcpDir, '.venv'))
}

export async function syncImageGenEnvironment({ quiet = false } = {}) {
  ensureImageGenMcpRepoPresent()
  ensureUvAvailable()

  await new Promise((resolve, reject) => {
    const child = spawn('uv', ['sync'], {
      cwd: imageGenMcpDir,
      shell: false,
      stdio: quiet ? 'ignore' : 'inherit',
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`uv sync failed with exit code ${code ?? 'unknown'}.`))
    })
    child.on('error', reject)
  })
}

export function buildImageGenCommand({ transport = 'streamable-http', extraArgs = [] } = {}) {
  const args = [
    '--directory',
    imageGenMcpDir,
    'run',
    'python',
    '-m',
    'image_gen_mcp.server',
    '--config',
    rootEnvPath,
    '--transport',
    transport,
    ...extraArgs,
  ]

  if (transport !== 'stdio') {
    const host = process.env.SERVER__HOST?.trim()
    const port = process.env.SERVER__PORT?.trim()

    if (host) {
      args.push('--host', host)
    }

    if (port) {
      args.push('--port', port)
    }
  }

  return {
    args,
    command: 'uv',
  }
}
