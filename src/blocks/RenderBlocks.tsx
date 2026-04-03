import React, { Fragment } from 'react'

import type { Page, Pricing } from '@/payload-types'

import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContactRequestBlock } from '@/blocks/ContactRequest/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { PricingTableBlock } from '@/blocks/PricingTable/Component'
import { ServiceGridBlock } from '@/blocks/ServiceGrid/Component'
import { TestimonialsBlock } from '@/blocks/Testimonials/Component'
import { getCachedGlobal } from '@/utilities/getGlobals'

type Props = {
  blocks: Page['layout'][0][]
  /** Avoids a second query when the parent already loaded pricing. */
  pricingGlobal?: Pricing | null
}

export async function RenderBlocks({ blocks, pricingGlobal: pricingProp }: Props) {
  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0
  const needsPricingGlobal = hasBlocks && blocks.some((b) => b.blockType === 'pricingTable')
  const pricingGlobal =
    pricingProp !== undefined
      ? pricingProp
      : needsPricingGlobal
        ? await getCachedGlobal('pricing', 2)()
        : null

  if (!hasBlocks) return null

  return (
    <Fragment>
      {blocks.map((block, index) => {
        const { blockType } = block

        if (blockType === 'pricingTable') {
          return (
            <div className="my-16" key={index}>
              <PricingTableBlock {...block} globalPricing={pricingGlobal} />
            </div>
          )
        }

        if (blockType === 'serviceGrid') {
          return (
            <div className="my-16" key={index}>
              <ServiceGridBlock {...block} blockIndex={index} />
            </div>
          )
        }

        if (blockType === 'archive') {
          return (
            <div className="my-16" key={index}>
              <ArchiveBlock {...(block as unknown as React.ComponentProps<typeof ArchiveBlock>)} />
            </div>
          )
        }
        if (blockType === 'content') {
          return (
            <div className="my-16" key={index}>
              <ContentBlock {...(block as unknown as React.ComponentProps<typeof ContentBlock>)} />
            </div>
          )
        }
        if (blockType === 'cta') {
          return (
            <div className="my-16" key={index}>
              <CallToActionBlock
                {...(block as unknown as React.ComponentProps<typeof CallToActionBlock>)}
              />
            </div>
          )
        }
        if (blockType === 'formBlock') {
          return (
            <div className="my-16" key={index}>
              <FormBlock {...(block as unknown as React.ComponentProps<typeof FormBlock>)} />
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
              <TestimonialsBlock {...(block as React.ComponentProps<typeof TestimonialsBlock>)} />
            </div>
          )
        }
        if (blockType === 'mediaBlock') {
          return (
            <div className="my-16" key={index}>
              <MediaBlock
                {...(block as unknown as React.ComponentProps<typeof MediaBlock>)}
                disableInnerContainer
              />
            </div>
          )
        }

        return null
      })}
    </Fragment>
  )
}
