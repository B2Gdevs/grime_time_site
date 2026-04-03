import { createLocalReq, type File as PayloadFile } from 'payload'

import { getCurrentAuthContext } from '@/lib/auth/getAuthContext'
import { buildMediaDevtoolsSummary, buildPageMediaUpdateData } from '@/lib/media/pageMediaDevtools'
import { generateOpenAIImage } from '@/lib/media/openaiImageGeneration'
import { generateOpenAIVideo } from '@/lib/media/openaiVideoGeneration'
import { getServerSideURL } from '@/utilities/getURL'
import type { Media, Page } from '@/payload-types'

async function requireStaffPageComposerAuth() {
  const auth = await getCurrentAuthContext()

  if (!auth.realUser || !auth.isRealAdmin) {
    return null
  }

  return auth
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

async function generatePayloadImageFile(prompt: string): Promise<PayloadFile> {
  const { buffer, contentType, extension } = await generateOpenAIImage({
    model: 'gpt-image-1',
    output_format: 'png',
    prompt,
    quality: 'high',
    size: '1024x1024',
  })

  return {
    data: buffer,
    mimetype: contentType,
    name: `page-media-${Date.now()}.${extension}`,
    size: buffer.byteLength,
  }
}

function getAbsoluteMediaUrl(url: null | string | undefined): null | string {
  if (!url) {
    return null
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  return new URL(url, getServerSideURL()).toString()
}

async function loadSourceImageReference(args: {
  mediaId: number
  payload: Awaited<ReturnType<typeof getCurrentAuthContext>>['payload']
  req: Awaited<ReturnType<typeof createLocalReq>>
}): Promise<
  | {
      contentType: string
      data: Buffer
      filename: string
    }
  | null
> {
  const media = (await args.payload.findByID({
    collection: 'media',
    depth: 0,
    id: args.mediaId,
    req: args.req,
  })) as Media

  if (!media.mimeType?.startsWith('image/')) {
    return null
  }

  const sourceUrl = getAbsoluteMediaUrl(media.url)

  if (!sourceUrl) {
    return null
  }

  const response = await fetch(sourceUrl)

  if (!response.ok) {
    throw new Error(`Unable to fetch source media ${args.mediaId} for video generation.`)
  }

  const data = Buffer.from(await response.arrayBuffer())
  return {
    contentType: media.mimeType,
    data,
    filename: media.filename || `media-${media.id}.png`,
  }
}

async function generatePayloadVideoFile(args: {
  payload: Awaited<ReturnType<typeof getCurrentAuthContext>>['payload']
  prompt: string
  req: Awaited<ReturnType<typeof createLocalReq>>
  sourceMediaId?: null | number
}): Promise<PayloadFile> {
  const inputReference = args.sourceMediaId
    ? await loadSourceImageReference({
        mediaId: args.sourceMediaId,
        payload: args.payload,
        req: args.req,
      })
    : null

  const { buffer, contentType, extension } = await generateOpenAIVideo({
    inputReference,
    prompt: args.prompt,
  })

  return {
    data: buffer,
    mimetype: contentType,
    name: `page-media-${Date.now()}.${extension}`,
    size: buffer.byteLength,
  }
}

async function requirePageForSwap(args: {
  pageId: number
  payload: Awaited<ReturnType<typeof getCurrentAuthContext>>['payload']
  relationPath: string
}): Promise<Page> {
  const page = (await args.payload.findByID({
    collection: 'pages',
    depth: 0,
    id: args.pageId,
    overrideAccess: true,
  })) as Page

  buildPageMediaUpdateData({
    mediaId: 1,
    page,
    relationPath: args.relationPath,
  })

  return page
}

function buildMediaResponse(doc: Media | null | undefined) {
  return doc ? buildMediaDevtoolsSummary(doc) : null
}

function parsePositiveNumber(value: FormDataEntryValue | null): null | number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function parseUpload(value: FormDataEntryValue | null): File | null {
  return value instanceof File && value.size > 0 ? value : null
}

function parseMediaKind(value: FormDataEntryValue | null): 'image' | 'video' {
  return value === 'video' ? 'video' : 'image'
}

export async function GET(): Promise<Response> {
  const auth = await requireStaffPageComposerAuth()

  if (!auth) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payloadReq = await createLocalReq({ user: auth.realUser || undefined }, auth.payload)
  const media = await auth.payload.find({
    collection: 'media',
    depth: 0,
    limit: 48,
    req: payloadReq,
    sort: '-updatedAt',
  })

  return Response.json({
    items: (media.docs as Media[]).map((doc) => buildMediaDevtoolsSummary(doc)),
  })
}

export async function POST(request: Request): Promise<Response> {
  const auth = await requireStaffPageComposerAuth()

  if (!auth) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const action = String(formData.get('action') || '')
  const alt = String(formData.get('alt') || '').trim()
  const mediaKind = parseMediaKind(formData.get('mediaKind'))
  const sourceMediaId = parsePositiveNumber(formData.get('sourceMediaId'))
  const payloadReq = await createLocalReq({ user: auth.realUser || undefined }, auth.payload)

  if (action === 'generate-replace-existing' || action === 'generate-and-swap') {
    const prompt = String(formData.get('prompt') || '').trim()

    if (!prompt) {
      return Response.json({ error: 'A prompt is required.' }, { status: 400 })
    }

    const generatedFile =
      mediaKind === 'video'
        ? await generatePayloadVideoFile({
            payload: auth.payload,
            prompt,
            req: payloadReq,
            sourceMediaId,
          })
        : await generatePayloadImageFile(prompt)

    if (action === 'generate-replace-existing') {
      const mediaId = parsePositiveNumber(formData.get('mediaId'))

      if (!mediaId) {
        return Response.json({ error: 'A valid media id is required.' }, { status: 400 })
      }

      const updated = await auth.payload.update({
        collection: 'media',
        data: {
          alt: alt || prompt.slice(0, 240),
        },
        depth: 0,
        file: generatedFile,
        id: mediaId,
        req: payloadReq,
      })

      return Response.json({
        media: buildMediaResponse(updated as Media),
        mediaId: updated.id,
        ok: true,
      })
    }

    const pageId = parsePositiveNumber(formData.get('pageId'))
    const relationPath = String(formData.get('relationPath') || '').trim()

    if (!pageId || !relationPath) {
      return Response.json({ error: 'Page id and relation path are required.' }, { status: 400 })
    }

    try {
      const page = await requirePageForSwap({
        pageId,
        payload: auth.payload,
        relationPath,
      })

      const created = await auth.payload.create({
        collection: 'media',
        data: {
          alt: alt || prompt.slice(0, 240),
        },
        depth: 0,
        file: generatedFile,
        req: payloadReq,
      })

      await auth.payload.update({
        collection: 'pages',
        data: buildPageMediaUpdateData({
          mediaId: Number(created.id),
          page,
          relationPath,
        }),
        depth: 0,
        id: pageId,
        req: payloadReq,
      })

      return Response.json({
        media: buildMediaResponse(created as Media),
        mediaId: created.id,
        ok: true,
        pageId,
      })
    } catch (error) {
      return Response.json(
        {
          error: error instanceof Error ? error.message : 'Invalid page media path.',
        },
        { status: 400 },
      )
    }
  }

  if (action === 'generate-only') {
    const prompt = String(formData.get('prompt') || '').trim()

    if (!prompt) {
      return Response.json({ error: 'A prompt is required.' }, { status: 400 })
    }

    const created = await auth.payload.create({
      collection: 'media',
      data: {
        alt: alt || prompt.slice(0, 240),
      },
      depth: 0,
      file:
        mediaKind === 'video'
          ? await generatePayloadVideoFile({
              payload: auth.payload,
              prompt,
              req: payloadReq,
              sourceMediaId,
            })
          : await generatePayloadImageFile(prompt),
      req: payloadReq,
    })

    return Response.json({
      media: buildMediaResponse(created as Media),
      mediaId: created.id,
      ok: true,
    })
  }

  if (action === 'swap-existing-reference') {
    const mediaId = parsePositiveNumber(formData.get('mediaId'))
    const pageId = parsePositiveNumber(formData.get('pageId'))
    const relationPath = String(formData.get('relationPath') || '').trim()

    if (!mediaId || !pageId || !relationPath) {
      return Response.json({ error: 'Media id, page id, and relation path are required.' }, { status: 400 })
    }

    try {
      const page = await requirePageForSwap({
        pageId,
        payload: auth.payload,
        relationPath,
      })

      await auth.payload.update({
        collection: 'pages',
        data: buildPageMediaUpdateData({
          mediaId,
          page,
          relationPath,
        }),
        depth: 0,
        id: pageId,
        req: payloadReq,
      })

      const media = (await auth.payload.findByID({
        collection: 'media',
        depth: 0,
        id: mediaId,
        req: payloadReq,
      })) as Media

      return Response.json({
        media: buildMediaResponse(media),
        mediaId,
        ok: true,
        pageId,
      })
    } catch (error) {
      return Response.json(
        {
          error: error instanceof Error ? error.message : 'Unable to swap the page media reference.',
        },
        { status: 400 },
      )
    }
  }

  const upload = parseUpload(formData.get('file'))

  if (!upload) {
    return Response.json({ error: 'A file upload is required.' }, { status: 400 })
  }

  if (action === 'replace-existing') {
    const mediaId = parsePositiveNumber(formData.get('mediaId'))

    if (!mediaId) {
      return Response.json({ error: 'A valid media id is required.' }, { status: 400 })
    }

    const updated = await auth.payload.update({
      collection: 'media',
      data: alt ? { alt } : {},
      depth: 0,
      file: await toPayloadFile(upload),
      id: mediaId,
      req: payloadReq,
    })

    return Response.json({
      media: buildMediaResponse(updated as Media),
      mediaId: updated.id,
      ok: true,
    })
  }

  if (action === 'create-and-swap') {
    const pageId = parsePositiveNumber(formData.get('pageId'))
    const relationPath = String(formData.get('relationPath') || '').trim()

    if (!pageId || !relationPath) {
      return Response.json({ error: 'Page id and relation path are required.' }, { status: 400 })
    }

    try {
      const page = await requirePageForSwap({
        pageId,
        payload: auth.payload,
        relationPath,
      })

      const created = await auth.payload.create({
        collection: 'media',
        data: {
          alt: alt || upload.name.replace(/\.[a-z0-9]+$/i, ''),
        },
        depth: 0,
        file: await toPayloadFile(upload),
        req: payloadReq,
      })

      await auth.payload.update({
        collection: 'pages',
        data: buildPageMediaUpdateData({
          mediaId: Number(created.id),
          page,
          relationPath,
        }),
        depth: 0,
        id: pageId,
        req: payloadReq,
      })

      return Response.json({
        media: buildMediaResponse(created as Media),
        mediaId: created.id,
        ok: true,
        pageId,
      })
    } catch (error) {
      return Response.json(
        {
          error: error instanceof Error ? error.message : 'Invalid page media path.',
        },
        { status: 400 },
      )
    }
  }

  if (action === 'create-only') {
    const created = await auth.payload.create({
      collection: 'media',
      data: {
        alt: alt || upload.name.replace(/\.[a-z0-9]+$/i, ''),
      },
      depth: 0,
      file: await toPayloadFile(upload),
      req: payloadReq,
    })

    return Response.json({
      media: buildMediaResponse(created as Media),
      mediaId: created.id,
      ok: true,
    })
  }

  return Response.json({ error: 'Unsupported page media action.' }, { status: 400 })
}
