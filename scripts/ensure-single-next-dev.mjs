/**
 * Next.js 16+ uses a lock under .next/dev/lock (when experimental.lockDistDir is on).
 * If a previous dev server exited uncleanly or is still running, `next dev` aborts.
 * This script removes stale locks or stops the PID recorded in the lock before dev starts.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const lockPaths = [
  path.join(root, '.next', 'dev', 'lock'),
  path.join(root, '.next', 'lock'),
]

function pidAlive(pid) {
  if (!Number.isFinite(pid) || pid <= 0) return false
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function stopPid(pid) {
  if (pid === process.pid) return
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(pid), '/F'], { stdio: 'ignore' })
  } else {
    try {
      process.kill(pid, 'SIGTERM')
    } catch {
      /* ignore */
    }
  }
}

function sleepSync(ms) {
  const end = Date.now() + ms
  while (Date.now() < end) {
    /* spin */
  }
}

for (const lockPath of lockPaths) {
  if (!fs.existsSync(lockPath)) continue

  let pid
  try {
    const raw = fs.readFileSync(lockPath, 'utf8')
    const info = JSON.parse(raw)
    pid = Number(info.pid)
  } catch {
    try {
      fs.unlinkSync(lockPath)
    } catch {
      /* ignore */
    }
    continue
  }

  if (pidAlive(pid)) {
    console.log(`Stopping existing Next.js dev server (PID ${pid})…`)
    stopPid(pid)
    for (let i = 0; i < 30; i++) {
      try {
        fs.unlinkSync(lockPath)
        break
      } catch {
        sleepSync(100)
      }
    }
  } else {
    try {
      fs.unlinkSync(lockPath)
    } catch {
      /* ignore */
    }
  }
}
