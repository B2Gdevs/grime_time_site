import { createLocalReq, type File as PayloadFile } from 'payload'

import { getCurrentAuthContext } from '@/lib/auth/getAuthContext'
import { isLocalDevtoolsRequestHeaders } from '@/lib/auth/localDevtools'
import { buildPageMediaUpdateData } from '@/lib/media/pageMediaDevtools'
import { generateOpenAIImage } from '@/lib/media/openaiImageGeneration'
import type { Page } from '@/payload-types'

async function requireLocalAdminDevtools(request: Request) {
  const auth = await getCurrentAuthContext()

  if (!isLocalDevtoolsRequestHeaders(request.headers) || !auth.realUser || !auth.isRealAdmin) {
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

function parsePositiveNumber(value: FormDataEntryValue | null): null | number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function parseUpload(value: FormDataEntryValue | null): File | null {
  return value instanceof File && value.size > 0 ? value : null
}

export async function POST(request: Request): Promise<Response> {
  const auth = await requireLocalAdminDevtools(request)

  if (!auth) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const realUser = auth.realUser

  if (!realUser) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const action = String(formData.get('action') || '')
  const alt = String(formData.get('alt') || '').trim()
  const payloadReq = await createLocalReq({ user: realUser }, auth.payload)

  if (action === 'generate-replace-existing' || action === 'generate-and-swap') {
    const prompt = String(formData.get('prompt') || '').trim()

    if (!prompt) {
      return Response.json({ error: 'A prompt is required.' }, { status: 400 })
    }

    const generatedFile = await generatePayloadImageFile(prompt)

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
        mediaId: updated.id,
        ok: true,
      })
    }

    const pageId = parsePositiveNumber(formData.get('pageId'))
    const relationPath = String(formData.get('relationPath') || '').trim()

    if (!pageId || !relationPath) {
      return Response.json({ error: 'Page id and relation path are required.' }, { status: 400 })
    }

    const page = (await auth.payload.findByID({
      collection: 'pages',
      depth: 0,
      id: pageId,
      overrideAccess: true,
    })) as Page

    try {
      buildPageMediaUpdateData({
        mediaId: 1,
        page,
        relationPath,
      })
    } catch (error) {
      return Response.json(
        {
          error: error instanceof Error ? error.message : 'Invalid page media path.',
        },
        { status: 400 },
      )
    }

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
      mediaId: created.id,
      ok: true,
      pageId,
    })
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

    const page = (await auth.payload.findByID({
      collection: 'pages',
      depth: 0,
      id: pageId,
      overrideAccess: true,
    })) as Page

    try {
      buildPageMediaUpdateData({
        mediaId: 1,
        page,
        relationPath,
      })
    } catch (error) {
      return Response.json(
        {
          error: error instanceof Error ? error.message : 'Invalid page media path.',
        },
        { status: 400 },
      )
    }

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
      mediaId: created.id,
      ok: true,
      pageId,
    })
  }

  return Response.json({ error: 'Unsupported page media action.' }, { status: 400 })
}
