import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import { PageComposerCanvasViewport } from '@/components/page-composer/PageComposerCanvas'
import { PageMediaRegistryBridge } from '@/components/admin-impersonation/PageMediaDevtoolsContext'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { collectPageMediaReferences } from '@/lib/media/pageMediaDevtools'
import { normalizePageLayoutBlocks } from '@/lib/pages/pageLayoutBlocks'
import { queryPublicPageBySlug } from '@/lib/pages/queryPublicPageBySlug'
import { generateMeta } from '@/utilities/generateMeta'
import { draftMode } from 'next/headers'

export default async function HomePage() {
  await draftMode()
  const page = await queryPublicPageBySlug({ slug: 'home' })

  if (!page) {
    return <PayloadRedirects url="/" />
  }

  const layout = normalizePageLayoutBlocks({ page, pagePath: '/' })
  const pageMediaEntries = collectPageMediaReferences({ page: { ...page, layout }, pagePath: '/' })

  return (
    <>
      <PageMediaRegistryBridge
        entries={pageMediaEntries}
        pageId={Number(page.id)}
        pagePath="/"
        pageSlug={page.slug}
        pageTitle={page.title}
      />
      <PageComposerCanvasViewport>
        <div className="marketing-page-body">{await RenderBlocks({ blocks: layout, pagePath: '/' })}</div>
      </PageComposerCanvasViewport>
    </>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await queryPublicPageBySlug({ slug: 'home' })
  return generateMeta({ doc: page })
}
