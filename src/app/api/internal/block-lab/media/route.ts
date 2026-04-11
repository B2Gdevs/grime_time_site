import config from '@payload-config'
import { getPayload } from 'payload'

import {
  loadBlockLabLiveMediaLibrary,
  uploadBlockLabLiveMedia,
} from '@/lib/block-lab/liveMediaLibrary'

export async function GET(): Promise<Response> {
  if (process.env.NODE_ENV !== 'development') {
    return Response.json(
      {
        error: 'The block-lab live media library is only available in local development.',
      },
      { status: 403 },
    )
  }

  try {
    const payload = await getPayload({ config })
    const library = await loadBlockLabLiveMediaLibrary(payload)

    return Response.json(library)
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to load the live media library.',
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request): Promise<Response> {
  if (process.env.NODE_ENV !== 'development') {
    return Response.json(
      {
        error: 'The block-lab live media upload is only available in local development.',
      },
      { status: 403 },
    )
  }

  try {
    const payload = await getPayload({ config })
    const result = await uploadBlockLabLiveMedia({
      formData: await request.formData(),
      payload,
    })

    return Response.json(result)
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to upload live media.',
      },
      { status: 400 },
    )
  }
}
