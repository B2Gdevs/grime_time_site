import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { createLocalReq, getPayload, type RequiredDataFromCollectionSlug, type Where } from 'payload'
import { cache } from 'react'

import { homeStatic } from '@/endpoints/seed/home-static'
import { getCurrentAuthContext } from '@/lib/auth/getAuthContext'
import { hasContentAuthoringAccess } from '@/lib/auth/organizationAccess'
import { hasDatabaseUrl } from '@/utilities/buildTimeDb'

export function buildPublicPageWhere(args: {
  includePrivate: boolean
  slug: string
}): Where {
  if (args.includePrivate) {
    return {
      slug: {
        equals: args.slug,
      },
    }
  }

  return {
    and: [
      {
        slug: {
          equals: args.slug,
        },
      },
      {
        visibility: {
          equals: 'public',
        },
      },
    ],
  }
}

export async function generatePublicPageStaticParams() {
  if (!hasDatabaseUrl()) return []

  const payload = await getPayload({ config: configPromise })
  const pages = await payload.find({
    collection: 'pages',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    where: {
      visibility: {
        equals: 'public',
      },
    },
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
  const auth = await getCurrentAuthContext()
  const payload = auth.payload || (await getPayload({ config: configPromise }))
  const canUseContentAuthoring =
    auth.realUser ? await hasContentAuthoringAccess(payload, auth.realUser) : false
  const includePrivate = draft || auth.isRealAdmin || canUseContentAuthoring
  const payloadReq = includePrivate
    ? await createLocalReq({ user: auth.realUser || undefined }, payload)
    : undefined

  const result = await payload.find({
    collection: 'pages',
    draft: includePrivate,
    depth: 2,
    limit: 1,
    pagination: false,
    overrideAccess: false,
    req: payloadReq,
    where: buildPublicPageWhere({
      includePrivate,
      slug,
    }),
  })

  return (result.docs?.[0] || null) as RequiredDataFromCollectionSlug<'pages'> | null
})
