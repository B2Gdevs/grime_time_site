import fs from 'node:fs/promises'
import path from 'node:path'

import { getAiOpsAssistantCachePath, getAiOpsAssistantEmbeddingDimensions, getAiOpsAssistantResultLimit } from './config'
import type { CopilotRagHit } from './types'
import { loadApprovedOpsDocChunks } from './approved-docs'
import { embedTextsLocal } from './embeddings-local'

type CachedChunk = {
  chunkId: string
  content: string
  embedding: number[]
  heading: null | string
  slug: string
  sourceChecksum: string
  sourcePath: string
  title: string
}

type CachedIndexFile = {
  chunks: CachedChunk[]
  dimensions: number
  model: string
}

type SearchableChunk = CachedChunk

let searchableIndexPromise: Promise<SearchableChunk[]> | null = null

async function readCacheFile(filePath: string): Promise<CachedIndexFile | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    return JSON.parse(raw) as CachedIndexFile
  } catch {
    return null
  }
}

async function writeCacheFile(filePath: string, payload: CachedIndexFile) {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, JSON.stringify(payload), 'utf8')
  } catch {
    // Read-only or ephemeral runtime is acceptable; memory cache still works.
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0

  let dot = 0
  let magA = 0
  let magB = 0
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index]
    magA += a[index] * a[index]
    magB += b[index] * b[index]
  }

  if (magA === 0 || magB === 0) return 0
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

async function buildSearchableIndex(): Promise<SearchableChunk[]> {
  const filePath = getAiOpsAssistantCachePath()
  const cached = await readCacheFile(filePath)
  const chunks = await loadApprovedOpsDocChunks()
  const reused = new Map(
    (cached?.chunks ?? []).map((chunk) => [`${chunk.chunkId}:${chunk.sourceChecksum}`, chunk]),
  )

  const changed = chunks.filter((chunk) => !reused.has(`${chunk.chunkId}:${chunk.sourceChecksum}`))
  const changedEmbeddings = changed.length > 0 ? await embedTextsLocal(changed.map((chunk) => chunk.content)) : []
  let changedIndex = 0

  const resolved: SearchableChunk[] = chunks.map((chunk) => {
    const reusedChunk = reused.get(`${chunk.chunkId}:${chunk.sourceChecksum}`)
    if (reusedChunk) {
      return reusedChunk
    }

    const embedding = changedEmbeddings[changedIndex] ?? []
    changedIndex += 1

    return {
      ...chunk,
      embedding,
    }
  })

  await writeCacheFile(filePath, {
    chunks: resolved,
    dimensions: getAiOpsAssistantEmbeddingDimensions(),
    model: process.env.RAG_LOCAL_EMBEDDING_MODEL?.trim() || 'Xenova/all-MiniLM-L6-v2',
  })

  return resolved
}

async function getSearchableIndex(): Promise<SearchableChunk[]> {
  if (!searchableIndexPromise) {
    searchableIndexPromise = buildSearchableIndex()
  }

  return searchableIndexPromise
}

export async function searchOpsRag(query: string): Promise<CopilotRagHit[]> {
  const normalized = query.trim()
  if (!normalized) return []

  const [queryEmbedding] = await embedTextsLocal([normalized])
  const chunks = await getSearchableIndex()

  return chunks
    .map((chunk) => ({
      chunkId: chunk.chunkId,
      content: chunk.content,
      heading: chunk.heading,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
      slug: chunk.slug,
      sourcePath: chunk.sourcePath,
      title: chunk.title,
    }))
    .filter((chunk) => chunk.score > 0.15)
    .sort((a, b) => b.score - a.score)
    .slice(0, getAiOpsAssistantResultLimit())
}

export async function warmOpsRagIndex(): Promise<number> {
  const index = await getSearchableIndex()
  return index.length
}
