import fs from 'node:fs/promises'
import path from 'node:path'

import type { PayloadRequest } from 'payload'
import type { Payload } from 'payload'

const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

export type MediaFolderUploadItemResult =
  | {
      action: 'created' | 'replaced'
      filename: string
      mediaId: number | string
      relativePath: string
    }
  | {
      action: 'failed' | 'skipped'
      error?: string
      filename: string
      relativePath: string
    }

export type MediaFolderUploadSummary = {
  createdCount: number
  failedCount: number
  folderPath: string
  replacedCount: number
  scannedCount: number
  skippedCount: number
  results: MediaFolderUploadItemResult[]
}

export const DEFAULT_MEDIA_DROP_DIRECTORY_RELATIVE = '.grimetime-media-drop'

function normalizeText(value: null | string | undefined): null | string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function inferMimeType(filename: string) {
  return IMAGE_MIME_BY_EXTENSION[path.extname(filename).toLowerCase()] ?? null
}

function buildAltFromFilename(filename: string) {
  const name = path.parse(filename).name
  const normalized = name.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
  return normalized.length > 0 ? normalized : filename
}

async function walkImageFiles(args: {
  directory: string
  recursive: boolean
  rootDirectory: string
}): Promise<Array<{ absolutePath: string; filename: string; relativePath: string }>> {
  const entries = await fs.readdir(args.directory, { withFileTypes: true })
  const files: Array<{ absolutePath: string; filename: string; relativePath: string }> = []

  for (const entry of entries) {
    const absolutePath = path.join(args.directory, entry.name)

    if (entry.isDirectory()) {
      if (args.recursive) {
        files.push(
          ...(await walkImageFiles({
            directory: absolutePath,
            recursive: args.recursive,
            rootDirectory: args.rootDirectory,
          })),
        )
      }
      continue
    }

    if (!entry.isFile()) {
      continue
    }

    if (!inferMimeType(entry.name)) {
      continue
    }

    files.push({
      absolutePath,
      filename: entry.name,
      relativePath: path.relative(args.rootDirectory, absolutePath),
    })
  }

  return files.sort((left, right) => left.relativePath.localeCompare(right.relativePath))
}

export async function uploadMediaFolder(args: {
  altPrefix?: string
  createIfMissing?: boolean
  directory: string
  dryRun?: boolean
  payload: Payload
  payloadFolderId?: number
  recursive?: boolean
  replaceExisting?: boolean
  req: PayloadRequest
}) {
  const absoluteDirectory = path.resolve(args.directory)
  let stats = await fs.stat(absoluteDirectory).catch(() => null)

  if (!stats && args.createIfMissing) {
    await fs.mkdir(absoluteDirectory, { recursive: true })
    stats = await fs.stat(absoluteDirectory).catch(() => null)
  }

  if (!stats?.isDirectory()) {
    throw new Error(`Folder not found: ${absoluteDirectory}`)
  }

  const files = await walkImageFiles({
    directory: absoluteDirectory,
    recursive: Boolean(args.recursive),
    rootDirectory: absoluteDirectory,
  })

  const results: MediaFolderUploadItemResult[] = []

  for (const file of files) {
    const mimeType = inferMimeType(file.filename)

    if (!mimeType) {
      results.push({
        action: 'skipped',
        error: 'Unsupported image extension.',
        filename: file.filename,
        relativePath: file.relativePath,
      })
      continue
    }

    const existing = await args.payload.find({
      collection: 'media',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      req: args.req,
      where: {
        filename: {
          equals: file.filename,
        },
      },
    })

    const existingDoc = existing.docs[0] as { id: number | string } | undefined

    if (existingDoc && !args.replaceExisting) {
      results.push({
        action: 'skipped',
        error: 'Existing media with the same filename already exists.',
        filename: file.filename,
        relativePath: file.relativePath,
      })
      continue
    }

    if (args.dryRun) {
      results.push({
        action: existingDoc ? 'replaced' : 'created',
        filename: file.filename,
        mediaId: existingDoc?.id ?? 'dry-run',
        relativePath: file.relativePath,
      })
      continue
    }

    try {
      const buffer = await fs.readFile(file.absolutePath)
      const data = {
        alt: [normalizeText(args.altPrefix), buildAltFromFilename(file.filename)].filter(Boolean).join(' '),
        ...(typeof args.payloadFolderId === 'number' ? { folder: args.payloadFolderId } : {}),
      }

      const mediaDoc = existingDoc
        ? await args.payload.update({
            collection: 'media',
            data,
            file: {
              data: buffer,
              mimetype: mimeType,
              name: file.filename,
              size: buffer.byteLength,
            },
            id: existingDoc.id,
            overrideAccess: true,
            req: args.req,
          })
        : await args.payload.create({
            collection: 'media',
            data,
            depth: 0,
            draft: false,
            file: {
              data: buffer,
              mimetype: mimeType,
              name: file.filename,
              size: buffer.byteLength,
            },
            overrideAccess: true,
            req: args.req,
          })

      results.push({
        action: existingDoc ? 'replaced' : 'created',
        filename: file.filename,
        mediaId: mediaDoc.id,
        relativePath: file.relativePath,
      })
    } catch (error) {
      results.push({
        action: 'failed',
        error: error instanceof Error ? error.message : 'Unknown upload failure.',
        filename: file.filename,
        relativePath: file.relativePath,
      })
    }
  }

  return {
    createdCount: results.filter((result) => result.action === 'created').length,
    failedCount: results.filter((result) => result.action === 'failed').length,
    folderPath: absoluteDirectory,
    replacedCount: results.filter((result) => result.action === 'replaced').length,
    scannedCount: files.length,
    skippedCount: results.filter((result) => result.action === 'skipped').length,
    results,
  } satisfies MediaFolderUploadSummary
}
