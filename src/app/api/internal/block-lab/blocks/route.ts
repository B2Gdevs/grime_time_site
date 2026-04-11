import config from '@payload-config'
import { getPayload } from 'payload'

import {
  DEFAULT_BLOCK_LAB_PAGE_SLUG,
  loadBlockLabCatalog,
} from '@/lib/block-lab/liveBlockCatalog'

export async function GET(): Promise<Response> {
  if (process.env.NODE_ENV !== 'development') {
    return Response.json(
      {
        error: 'The block-lab live catalog is only available in local development.',
      },
      { status: 403 },
    )
  }

  try {
    const payload = await getPayload({ config })
    const catalog = await loadBlockLabCatalog(payload, {
      pageSlug:
        process.env.GRIME_TIME_BLOCK_LAB_PAGE_SLUG || DEFAULT_BLOCK_LAB_PAGE_SLUG,
    })

    return Response.json(catalog)
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to load the live block catalog.',
      },
      { status: 500 },
    )
  }
}
