import type { Metadata } from 'next'

import { InstantQuoteSection } from '@/components/InstantQuoteSection'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import { PageComposerCanvasViewport } from '@/components/admin-impersonation/PageComposerCanvas'
import { PageMediaRegistryBridge } from '@/components/admin-impersonation/PageMediaDevtoolsContext'
import configPromise from '@payload-config'
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'
import { draftMode } from 'next/headers'
import React from 'react'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'
import { getCurrentAuthContext } from '@/lib/auth/getAuthContext'
import { hasContentAuthoringAccess } from '@/lib/auth/organizationAccess'
import { collectPageMediaReferences } from '@/lib/media/pageMediaDevtools'
import { generatePublicPageStaticParams, queryPublicPageBySlug } from '@/lib/pages/queryPublicPageBySlug'
import { getInstantQuoteCatalog } from '@/lib/quotes/getInstantQuoteCatalog'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'

export async function generateStaticParams() {
  return generatePublicPageStaticParams()
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = 'home' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const url = '/' + decodedSlug
  let page: RequiredDataFromCollectionSlug<'pages'> | null

  page = await queryPublicPageBySlug({
    slug: decodedSlug,
  })

  if (!page) {
    const auth = await getCurrentAuthContext()
    const canUseComposer =
      auth.isRealAdmin || (auth.realUser ? await hasContentAuthoringAccess(auth.payload, auth.realUser) : false)

    if (canUseComposer) {
      return (
        <>
          <PayloadRedirects disableNotFound url={url} />
          <article className="marketing-page-shell pb-24">
            <PageClient />

            {draft && <LivePreviewListener />}

            <PageComposerCanvasViewport>
              <section className="mx-auto flex min-h-[40vh] max-w-4xl flex-col justify-center px-6 py-20">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  Unpublished route
                </p>
                <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-foreground">
                  Start composing this page in place.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                  This URL does not have a page document yet. Save a draft or publish from the visual composer to create it without leaving the route you are authoring.
                </p>
              </section>
            </PageComposerCanvasViewport>
          </article>
        </>
      )
    }

    return <PayloadRedirects url={url} />
  }

  const { hero, layout } = page
  const instantQuoteCatalog =
    slug === 'home' ? await getInstantQuoteCatalog({ draft, payload: await getPayload({ config: configPromise }) }) : null
  const pageMediaEntries = collectPageMediaReferences({ page, pagePath: url })

  return (
    <article className="marketing-page-shell pb-24">
      <PageMediaRegistryBridge
        entries={pageMediaEntries}
        pageId={Number(page.id)}
        pagePath={url}
        pageSlug={page.slug}
        pageTitle={page.title}
      />
      <PageClient />
      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <PageComposerCanvasViewport>
        <RenderHero {...hero} />
        <div className="marketing-page-body">
          {slug === 'home' && instantQuoteCatalog ? <InstantQuoteSection catalog={instantQuoteCatalog} /> : null}
          {await RenderBlocks({ blocks: layout })}
        </div>
      </PageComposerCanvasViewport>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = 'home' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const page = await queryPublicPageBySlug({
    slug: decodedSlug,
  })

  return generateMeta({ doc: page })
}
