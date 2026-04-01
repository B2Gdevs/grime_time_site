import crypto from 'node:crypto'

import { getPortalDocs, readPortalDoc } from '@/lib/docs/catalog'

type ApprovedDocChunk = {
  chunkId: string
  content: string
  heading: null | string
  slug: string
  sourceChecksum: string
  sourcePath: string
  title: string
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim()
}

function stripMarkdownNoise(value: string): string {
  return normalizeWhitespace(
    value
      .replace(/^---[\s\S]*?---/m, ' ')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
      .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
      .replace(/[>*_#~-]/g, ' '),
  )
}

function buildChecksum(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function chunkMarkdown(args: { markdown: string; slug: string; title: string; sourcePath: string }): ApprovedDocChunk[] {
  const lines = args.markdown.replace(/\r\n/g, '\n').split('\n')
  const chunks: ApprovedDocChunk[] = []
  let heading: null | string = null
  let buffer: string[] = []

  const flush = () => {
    const content = stripMarkdownNoise(buffer.join('\n'))
    buffer = []

    if (!content) return

    const maxLength = 1100
    if (content.length <= maxLength) {
      const sourceChecksum = buildChecksum(`${args.sourcePath}:${heading || args.title}:${content}`)
      chunks.push({
        chunkId: `${args.slug}:${chunks.length}`,
        content,
        heading,
        slug: args.slug,
        sourceChecksum,
        sourcePath: args.sourcePath,
        title: args.title,
      })
      return
    }

    const sentences = content.split(/(?<=[.!?])\s+/)
    let current = ''
    for (const sentence of sentences) {
      const next = current ? `${current} ${sentence}` : sentence
      if (next.length > maxLength && current) {
        const sourceChecksum = buildChecksum(`${args.sourcePath}:${heading || args.title}:${current}`)
        chunks.push({
          chunkId: `${args.slug}:${chunks.length}`,
          content: current,
          heading,
          slug: args.slug,
          sourceChecksum,
          sourcePath: args.sourcePath,
          title: args.title,
        })
        current = sentence
      } else {
        current = next
      }
    }
    if (current) {
      const sourceChecksum = buildChecksum(`${args.sourcePath}:${heading || args.title}:${current}`)
      chunks.push({
        chunkId: `${args.slug}:${chunks.length}`,
        content: current,
        heading,
        slug: args.slug,
        sourceChecksum,
        sourcePath: args.sourcePath,
        title: args.title,
      })
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (/^#{1,6}\s+/.test(trimmed)) {
      flush()
      heading = trimmed.replace(/^#{1,6}\s+/, '').trim() || null
      continue
    }

    if (!trimmed) {
      if (buffer.length > 0) {
        flush()
      }
      continue
    }

    buffer.push(trimmed)
  }

  flush()
  return chunks
}

export async function loadApprovedOpsDocChunks(): Promise<ApprovedDocChunk[]> {
  const docs = getPortalDocs({ isAdmin: true }).filter((doc) => doc.audience === 'admin')
  const chunkLists = await Promise.all(
    docs.map(async (doc) => {
      const markdown = await readPortalDoc(doc)
      return chunkMarkdown({
        markdown,
        slug: doc.slug,
        sourcePath: doc.filePath,
        title: doc.title,
      })
    }),
  )

  return chunkLists.flat()
}
