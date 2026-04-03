import { getPayload } from 'payload'

import config from '../../src/payload.config.js'

export async function cleanupPageBySlug(slug: string): Promise<void> {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'pages',
    overrideAccess: true,
    where: {
      slug: {
        equals: slug,
      },
    },
  })
}
