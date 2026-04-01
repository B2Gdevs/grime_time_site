import 'dotenv/config'

import { warmOpsRagIndex } from '@/lib/ai'

async function main() {
  const count = await warmOpsRagIndex()
  console.log(`[ai-ops-ingest] warmed ${count} internal doc chunks`)
}

void main().catch((error) => {
  console.error('[ai-ops-ingest] failed', error)
  process.exitCode = 1
})
