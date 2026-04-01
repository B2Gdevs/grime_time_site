import React from 'react'

import type { Page } from '@/payload-types'

import RichText from '@/components/RichText'

type LowImpactHeroType =
  | {
      children?: React.ReactNode
      richText?: never
    }
  | (Omit<Page['hero'], 'richText'> & {
      children?: never
      richText?: Page['hero']['richText']
    })

export const LowImpactHero: React.FC<LowImpactHeroType> = ({ children, richText }) => {
  return (
    <div className="marketing-page-hero-shell container mt-12 md:mt-16">
      <div className="max-w-[48rem] rounded-[2rem] border border-border/70 bg-card/74 p-6 shadow-[0_18px_80px_-56px_rgba(2,6,23,0.88)] md:p-8">
        {children || (richText && <RichText data={richText} enableGutter={false} />)}
      </div>
    </div>
  )
}
