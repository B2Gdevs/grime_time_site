import React, { Fragment } from 'react'
import config from '@payload-config'
import { getPayload } from 'payload'

import type { Page, Pricing } from '@/payload-types'

import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContactRequestBlock } from '@/blocks/ContactRequest/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { CustomHtmlBlock } from '@/blocks/CustomHtml/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { PricingTableBlock } from '@/blocks/PricingTable/Component'
import { ServiceGridBlock } from '@/blocks/ServiceGrid/Component'
import { TestimonialsBlock } from '@/blocks/Testimonials/Component'
import { getVisiblePageLayoutBlocks } from '@/lib/pages/pageLayoutVisibility'
import {
  linkedSharedSectionId,
  resolvePageComposerReusableBlock,
} from '@/lib/pages/pageComposerReusableBlocks'
import { loadPublishedSharedSectionsByIds } from '@/lib/pages/sharedSectionLibrary'
import { getCachedGlobal } from '@/utilities/getGlobals'

type Props = {
  blocks: Page['layout'][0][]
  /** Avoids a second query when the parent already loaded pricing. */
  pricingGlobal?: Pricing | null
}

export async function RenderBlocks({ blocks, pricingGlobal: pricingProp }: Props) {
  const visibleBlocks = getVisiblePageLayoutBlocks(blocks)
  const hasBlocks = visibleBlocks.length > 0
  const sharedSectionIds = Array.from(
    new Set(visibleBlocks.map((block) => linkedSharedSectionId(block)).filter((id): id is number => typeof id === 'number')),
  )
  const needsPricingGlobal = hasBlocks && visibleBlocks.some((b) => b.blockType === 'pricingTable')
  const pricingGlobal =
    pricingProp !== undefined
      ? pricingProp
      : needsPricingGlobal
        ? await getCachedGlobal('pricing', 2)()
        : null
  const sharedSectionsById =
    sharedSectionIds.length > 0
      ? await loadPublishedSharedSectionsByIds({
          ids: sharedSectionIds,
          payload: await getPayload({ config }),
        })
      : undefined

  if (!hasBlocks) return null

  return (
    <Fragment>
      {visibleBlocks.map((block, index) => {
        const resolvedBlock = resolvePageComposerReusableBlock(block, { sharedSectionsById })
        const { blockType } = resolvedBlock

        if (blockType === 'pricingTable') {
          return (
            <div className="my-16" key={index}>
              <PricingTableBlock {...resolvedBlock} globalPricing={pricingGlobal} />
            </div>
          )
        }

        if (blockType === 'serviceGrid') {
          return (
            <div className="my-16" key={index}>
              <ServiceGridBlock {...resolvedBlock} blockIndex={index} />
            </div>
          )
        }

        if (blockType === 'archive') {
          return (
            <div className="my-16" key={index}>
              <ArchiveBlock {...(resolvedBlock as unknown as React.ComponentProps<typeof ArchiveBlock>)} />
            </div>
          )
        }
        if (blockType === 'content') {
          return (
            <div className="my-16" key={index}>
              <ContentBlock {...(resolvedBlock as unknown as React.ComponentProps<typeof ContentBlock>)} />
            </div>
          )
        }
        if (blockType === 'cta') {
          return (
            <div className="my-16" key={index}>
              <CallToActionBlock
                {...(resolvedBlock as unknown as React.ComponentProps<typeof CallToActionBlock>)}
              />
            </div>
          )
        }
        if (blockType === 'formBlock') {
          return (
            <div className="my-16" key={index}>
              <FormBlock {...(resolvedBlock as unknown as React.ComponentProps<typeof FormBlock>)} />
            </div>
          )
        }
        if (blockType === 'contactRequest') {
          return (
            <div className="my-8" key={index}>
              <ContactRequestBlock />
            </div>
          )
        }
        if (blockType === 'testimonialsBlock') {
          return (
            <div className="my-8" key={index}>
              <TestimonialsBlock {...(resolvedBlock as React.ComponentProps<typeof TestimonialsBlock>)} />
            </div>
          )
        }
        if (blockType === 'mediaBlock') {
          return (
            <div className="my-16" key={index}>
              <MediaBlock
                {...(resolvedBlock as unknown as React.ComponentProps<typeof MediaBlock>)}
                disableInnerContainer
              />
            </div>
          )
        }
        if (blockType === 'customHtml') {
          return (
            <div className="my-16" key={index}>
              <CustomHtmlBlock {...(resolvedBlock as React.ComponentProps<typeof CustomHtmlBlock>)} />
            </div>
          )
        }

        return null
      })}
    </Fragment>
  )
}
