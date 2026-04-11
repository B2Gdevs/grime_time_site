import { createLocalReq, type File as PayloadFile, type Payload } from 'payload'

import type { Media } from '@/payload-types'

export type BlockLabLiveMediaItem = {
  alt: null | string
  filename: null | string
  id: number
  mimeType: null | string
  sizeBytes: null | number
  thumbnailUrl: null | string
  updatedAt: string
  url: null | string
}

export type BlockLabLiveMediaListResponse = {
  generatedAt: string
  items: BlockLabLiveMediaItem[]
}

export type BlockLabLiveMediaUploadResult =
  | {
      action: 'created'
      filename: string
      mediaId: number
    }
  | {
      action: 'failed' | 'skipped'
      error: string
      filename: string
    }

export type BlockLabLiveMediaUploadResponse = {
  createdCount: number
  failedCount: number
  generatedAt: string
  results: BlockLabLiveMediaUploadResult[]
  skippedCount: number
}

function buildMediaItem(doc: Media): BlockLabLiveMediaItem {
  return {
    alt: doc.alt || null,
    filename: doc.filename || null,
    id: doc.id,
    mimeType: doc.mimeType || null,
    sizeBytes: doc.filesize ?? null,
    thumbnailUrl: doc.sizes?.thumbnail?.url || doc.thumbnailURL || doc.url || null,
    updatedAt: doc.updatedAt,
    url: doc.url || null,
  }
}

async function toPayloadFile(upload: File): Promise<PayloadFile> {
  const buffer = Buffer.from(await upload.arrayBuffer())

  return {
    data: buffer,
    mimetype: upload.type || 'application/octet-stream',
    name: upload.name,
    size: buffer.byteLength,
  }
}

function parseUploads(formData: FormData) {
  return formData
    .getAll('files')
    .filter((value): value is File => value instanceof File && value.size > 0)
}

export async function loadBlockLabLiveMediaLibrary(
  payload: Payload,
): Promise<BlockLabLiveMediaListResponse> {
  const req = await createLocalReq({}, payload)
  const result = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 60,
    overrideAccess: true,
    pagination: false,
    req,
    sort: '-updatedAt',
  })

  return {
    generatedAt: new Date().toISOString(),
    items: (result.docs as Media[]).map((doc) => buildMediaItem(doc)),
  }
}

export async function uploadBlockLabLiveMedia(args: {
  formData: FormData
  payload: Payload
}): Promise<BlockLabLiveMediaUploadResponse> {
  const uploads = parseUploads(args.formData)

  if (uploads.length === 0) {
    throw new Error('No files were provided.')
  }

  const req = await createLocalReq({}, args.payload)
  const results: BlockLabLiveMediaUploadResult[] = []

  for (const upload of uploads) {
    if (!upload.type.startsWith('image/')) {
      results.push({
        action: 'failed',
        error: 'Only image files are supported here.',
        filename: upload.name,
      })
      continue
    }

    const existing = await args.payload.find({
      collection: 'media',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      req,
      where: {
        filename: {
          equals: upload.name,
        },
      },
    })

    const existingDoc = (existing.docs[0] as Media | undefined) ?? null

    if (existingDoc) {
      results.push({
        action: 'skipped',
        error: 'A media record with this filename already exists.',
        filename: upload.name,
      })
      continue
    }

    try {
      const created = (await args.payload.create({
        collection: 'media',
        data: {
          alt: upload.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim(),
        },
        depth: 0,
        draft: false,
        file: await toPayloadFile(upload),
        overrideAccess: true,
        req,
      })) as Media

      results.push({
        action: 'created',
        filename: upload.name,
        mediaId: created.id,
      })
    } catch (error) {
      results.push({
        action: 'failed',
        error: error instanceof Error ? error.message : 'Unknown upload error.',
        filename: upload.name,
      })
    }
  }

  return {
    createdCount: results.filter((result) => result.action === 'created').length,
    failedCount: results.filter((result) => result.action === 'failed').length,
    generatedAt: new Date().toISOString(),
    results,
    skippedCount: results.filter((result) => result.action === 'skipped').length,
  }
}
