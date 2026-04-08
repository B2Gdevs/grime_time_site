import React, { Fragment } from 'react'
import config from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'

import type { Page, Pricing } from '@/payload-types'

import { PageComposerCanvasSection } from '@/components/page-composer/PageComposerCanvas'
import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContactRequestBlock } from '@/blocks/ContactRequest/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { CustomHtmlBlock } from '@/blocks/CustomHtml/Component'
import { FeaturesBlock } from '@/blocks/Features/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { HeroBlock } from '@/blocks/Hero/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { PricingTableBlock } from '@/blocks/PricingTable/Component'
import { ServiceGridBlock } from '@/blocks/ServiceGrid/Component'
import { ServiceEstimatorBlock } from '@/blocks/ServiceEstimator/Component'
import { TestimonialsBlock } from '@/blocks/Testimonials/Component'
import { getVisiblePageLayoutBlocks } from '@/lib/pages/pageLayoutVisibility'
import { buildPageComposerSectionSummaries } from '@/lib/pages/pageComposer'
import { resolvePageComposerReusableBlock } from '@/lib/pages/pageComposerReusableBlocks'
import { getInstantQuoteCatalog } from '@/lib/quotes/getInstantQuoteCatalog'
import type { InstantQuoteCatalog } from '@/lib/quotes/instantQuoteCatalog'
import { getCachedGlobal } from '@/utilities/getGlobals'

type Props = {
  blocks: Page['layout'][0][]
  instantQuoteCatalog?: InstantQuoteCatalog | null
  pagePath?: string
  /** Avoids a second query when the parent already loaded pricing. */
  pricingGlobal?: Pricing | null
}

export async function RenderBlocks({ blocks, instantQuoteCatalog: quoteCatalogProp, pagePath, pricingGlobal: pricingProp }: Props) {
  const layoutBlocks = blocks || []
  const visibleBlocks = getVisiblePageLayoutBlocks(layoutBlocks).map((block) => ({
    block,
    index: layoutBlocks.indexOf(block),
  }))
  const hasBlocks = visibleBlocks.length > 0
  const needsPricingGlobal = hasBlocks && visibleBlocks.some(({ block }) => block.blockType === 'pricingTable')
  const needsInstantQuoteCatalog =
    hasBlocks &&
    visibleBlocks.some(({ block }) => block.blockType === 'serviceEstimator' || block.blockType === 'heroBlock')
  const pricingGlobal =
    pricingProp !== undefined
      ? pricingProp
      : needsPricingGlobal
        ? await getCachedGlobal('pricing', 2)()
        : null
  const { isEnabled: draft } = needsInstantQuoteCatalog ? await draftMode() : { isEnabled: false }
  const instantQuoteCatalog =
    quoteCatalogProp !== undefined
      ? quoteCatalogProp
      : needsInstantQuoteCatalog
        ? await getInstantQuoteCatalog({ draft, payload: await getPayload({ config }) })
        : null
  const sectionSummaries = buildPageComposerSectionSummaries(layoutBlocks)

  if (!hasBlocks) return null

  return (
    <Fragment>
      {visibleBlocks.map(({ block, index }) => {
        const resolvedBlock = resolvePageComposerReusableBlock(block)
        const { blockType } = resolvedBlock
        const summaryLabel = sectionSummaries[index]?.label || `${resolvedBlock.blockType} block ${index + 1}`

        let blockNode: React.ReactNode = null

        if (blockType === 'heroBlock') {
          blockNode = (
            <HeroBlock
              {...(resolvedBlock as React.ComponentProps<typeof HeroBlock>)}
              blockIndex={index}
              instantQuoteCatalog={instantQuoteCatalog}
              layoutBlocks={layoutBlocks}
              pagePath={pagePath}
            />
          )
        }
        else if (blockType === 'pricingTable') {
          blockNode = (
            <div className="my-16">
              <PricingTableBlock {...resolvedBlock} globalPricing={pricingGlobal} />
            </div>
          )
        }
        else if (blockType === 'serviceGrid') {
          blockNode = (
            <div className="my-16">
              <ServiceGridBlock {...resolvedBlock} blockIndex={index} />
            </div>
          )
        }
        else if (blockType === 'features') {
          blockNode = (
            <div className="my-16">
              <FeaturesBlock {...resolvedBlock} />
            </div>
          )
        }
        else if (blockType === 'archive') {
          blockNode = (
            <div className="my-16">
              <ArchiveBlock {...(resolvedBlock as unknown as React.ComponentProps<typeof ArchiveBlock>)} />
            </div>
          )
        }
        else if (blockType === 'content') {
          blockNode = (
            <div className="my-16">
              <ContentBlock {...(resolvedBlock as unknown as React.ComponentProps<typeof ContentBlock>)} />
            </div>
          )
        }
        else if (blockType === 'cta') {
          blockNode = (
            <div className="my-16">
              <CallToActionBlock
                {...(resolvedBlock as unknown as React.ComponentProps<typeof CallToActionBlock>)}
              />
            </div>
          )
        }
        else if (blockType === 'formBlock') {
          blockNode = (
            <div className="my-16">
              <FormBlock {...(resolvedBlock as unknown as React.ComponentProps<typeof FormBlock>)} />
            </div>
          )
        }
        else if (blockType === 'contactRequest') {
          blockNode = (
            <div className="my-8">
              <ContactRequestBlock />
            </div>
          )
        }
        else if (blockType === 'testimonialsBlock') {
          blockNode = (
            <div className="my-8">
              <TestimonialsBlock {...(resolvedBlock as React.ComponentProps<typeof TestimonialsBlock>)} />
            </div>
          )
        }
        else if (blockType === 'mediaBlock') {
          blockNode = (
            <div className="my-16">
              <MediaBlock
                {...(resolvedBlock as unknown as React.ComponentProps<typeof MediaBlock>)}
                blockIndex={index}
                disableInnerContainer
              />
            </div>
          )
        }
        else if (blockType === 'customHtml') {
          blockNode = (
            <div className="my-16">
              <CustomHtmlBlock {...(resolvedBlock as React.ComponentProps<typeof CustomHtmlBlock>)} />
            </div>
          )
        }
        else if (blockType === 'serviceEstimator') {
          if (!instantQuoteCatalog) {
            return null
          }

          blockNode = (
            <div className="my-16">
              <ServiceEstimatorBlock catalog={instantQuoteCatalog} />
            </div>
          )
        }

        if (!blockNode) {
          return null
        }

        return (
          <PageComposerCanvasSection index={index} key={index} label={summaryLabel}>
            {blockNode}
          </PageComposerCanvasSection>
        )
      })}
    </Fragment>
  )
}
