import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import { PageMediaRegistryBridge } from '@/components/admin-impersonation/PageMediaDevtoolsContext'
import { GrimeTimeMarketingHome } from '@/components/home/GrimeTimeMarketingHome'
import { collectPageMediaReferences } from '@/lib/media/pageMediaDevtools'
import { queryPublicPageBySlug } from '@/lib/pages/queryPublicPageBySlug'
import { getInstantQuoteCatalog } from '@/lib/quotes/getInstantQuoteCatalog'
import { generateMeta } from '@/utilities/generateMeta'
import { draftMode } from 'next/headers'
import { getPayload } from 'payload'

export default async function HomePage() {
  const { isEnabled: draft } = await draftMode()
  const page = await queryPublicPageBySlug({ slug: 'home' })

  if (!page) {
    return <PayloadRedirects url="/" />
  }

  const payload = await getPayload({ config: configPromise })
  const instantQuoteCatalog = await getInstantQuoteCatalog({ draft, payload })
  const pageMediaEntries = collectPageMediaReferences({ page, pagePath: '/' })

  return (
    <>
      <PageMediaRegistryBridge
        entries={pageMediaEntries}
        pageId={Number(page.id)}
        pagePath="/"
        pageSlug={page.slug}
        pageTitle={page.title}
      />
      <GrimeTimeMarketingHome instantQuoteCatalog={instantQuoteCatalog} page={page} />
    </>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await queryPublicPageBySlug({ slug: 'home' })
  return generateMeta({ doc: page })
}
