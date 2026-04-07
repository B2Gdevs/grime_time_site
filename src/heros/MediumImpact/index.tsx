import React from 'react'

import type { Page } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import { PageHeroMediaEditable, PageHeroRichTextEditable } from '@/components/home/PageHeroRichTextEditable'
import RichText from '@/components/RichText'
import { extractLexicalPlainText } from '@/lib/marketing/public-shell'

export const MediumImpactHero: React.FC<Page['hero']> = ({ links, media, richText }) => {
  const heroBody = richText ? extractLexicalPlainText(richText) : ''

  return (
    <div className="marketing-page-hero-shell pt-12 md:pt-16">
      <div className="container mb-8">
        <PageHeroRichTextEditable
          body={heroBody}
          className="min-h-40 border-primary/30 bg-background/92 text-base leading-8 text-foreground"
        >
          {richText ? <RichText className="mb-6" data={richText} enableGutter={false} /> : null}
        </PageHeroRichTextEditable>

        {Array.isArray(links) && links.length > 0 && (
          <ul className="flex gap-4">
            {links.map(({ link }, i) => {
              return (
                <li key={i}>
                  <CMSLink {...link} />
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <div className="container">
        {media && typeof media === 'object' && (
          <PageHeroMediaEditable>
            <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/70 p-3 shadow-[0_18px_80px_-54px_rgba(2,6,23,0.85)]">
              <Media
                className="rounded-[1.5rem]"
                imgClassName=""
                priority
                resource={media}
              />
              {media?.caption && (
                <div className="mt-3">
                  <RichText data={media.caption} enableGutter={false} />
                </div>
              )}
            </div>
          </PageHeroMediaEditable>
        )}
      </div>
    </div>
  )
}
