import React from 'react'

import type { CallToActionBlock as CTABlockProps } from '@/payload-types'

import RichText from '@/components/RichText'
import { CMSLink } from '@/components/Link'

export const CallToActionBlock: React.FC<CTABlockProps> = ({ links, richText }) => {
  return (
    <section className="container">
      <div className="site-section-shell overflow-hidden px-6 py-8 md:px-10 md:py-10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-[48rem]">
            {richText && <RichText className="mb-0" data={richText} enableGutter={false} />}
          </div>
          <div className="flex flex-col gap-4">
            {(links || []).map(({ link }, i) => {
              return <CMSLink key={i} size="lg" {...link} />
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
