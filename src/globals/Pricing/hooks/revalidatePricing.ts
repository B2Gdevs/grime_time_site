import type { GlobalAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache.js'

export const revalidatePricing: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating pricing global')
    revalidateTag('global_pricing', 'max')
  }
  return doc
}
