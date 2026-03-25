import type { GlobalAfterChangeHook } from 'payload'

import { revalidatePath } from 'next/cache'

export const revalidateQuoteSettings: GlobalAfterChangeHook = ({ doc, req: { context, payload } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating quote settings')
    revalidatePath('/')
  }

  return doc
}
