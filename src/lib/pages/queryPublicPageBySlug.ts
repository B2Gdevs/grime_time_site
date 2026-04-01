import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'
import { cache } from 'react'

import { homeStatic } from '@/endpoints/seed/home-static'
import { hasDatabaseUrl } from '@/utilities/buildTimeDb'

export async function generatePublicPageStaticParams() {
  if (!hasDatabaseUrl()) return []

  const payload = await getPayload({ config: configPromise })
  const pages = await payload.find({
    collection: 'pages',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  return pages.docs?.filter((doc) => doc.slug !== 'home').map(({ slug }) => ({ slug }))
}

export const queryPublicPageBySlug = cache(async ({ slug }: { slug: string }) => {
  if (!hasDatabaseUrl()) {
    return slug === 'home' ? homeStatic : null
  }

  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'pages',
    draft,
    depth: 2,
    limit: 1,
    pagination: false,
    overrideAccess: draft,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return (result.docs?.[0] || null) as RequiredDataFromCollectionSlug<'pages'> | null
})
