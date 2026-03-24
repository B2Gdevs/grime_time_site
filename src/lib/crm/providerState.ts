import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { CrmProviderSlug } from './types'

const runtimeDirectory = path.resolve(process.cwd(), '.runtime')
const stateFilePath = path.join(runtimeDirectory, 'crm-provider.json')

type StoredCrmProviderState = {
  provider: CrmProviderSlug
}

export async function readStoredCrmProvider(): Promise<CrmProviderSlug | null> {
  try {
    const raw = await readFile(stateFilePath, 'utf8')
    const parsed = JSON.parse(raw) as StoredCrmProviderState

    if (parsed.provider === 'engagebay' || parsed.provider === 'hubspot') {
      return parsed.provider
    }

    return null
  } catch {
    return null
  }
}

export async function writeStoredCrmProvider(provider: CrmProviderSlug): Promise<void> {
  await mkdir(runtimeDirectory, { recursive: true })
  await writeFile(stateFilePath, JSON.stringify({ provider }, null, 2), 'utf8')
}
