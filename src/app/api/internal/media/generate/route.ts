import type { File } from 'payload'
import { createLocalReq } from 'payload'

import { userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import { generateOpenAIImage } from '@/lib/media/openaiImageGeneration'
import { requirePayloadUser } from '@/lib/auth/requirePayloadUser'

export async function POST(request: Request): Promise<Response> {
  const auth = await requirePayloadUser(request)
  if (!auth || !userIsAdmin(auth.user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as null | {
    prompt?: string
    alt?: string
    model?: string
  }

  const prompt = body?.prompt?.trim()
  if (!prompt) {
    return Response.json({ error: 'Missing prompt' }, { status: 400 })
  }

  const model = (body?.model?.trim() || 'gpt-image-1') as string
  const output_format: 'png' | 'jpeg' | 'webp' = 'png'

  try {
    const { buffer, contentType, extension } = await generateOpenAIImage({
      prompt,
      model,
      // Defaults tuned for predictable output size in marketing/Media.
      size: '1024x1024',
      quality: 'high',
      output_format,
    })

    const filename = `openai-${Date.now()}.${extension}`
    const file: File = {
      name: filename,
      data: buffer,
      mimetype: contentType,
      size: buffer.byteLength,
    }

    const payloadReq = await createLocalReq({ user: auth.user }, auth.payload)
    const doc = await auth.payload.create({
      collection: 'media',
      depth: 0,
      data: {
        alt: (body?.alt?.trim() || prompt).slice(0, 240),
      },
      file,
      req: payloadReq,
    })

    return Response.json({
      id: doc.id,
      title: doc.alt ?? doc.filename ?? 'Generated image',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message }, { status: 500 })
  }
}

