import React from 'react'

import type { Pricing, PricingTableBlock as PricingTableBlockData } from '@/payload-types'

import { CMSLink } from '@/components/Link'

type PricingPlanRow =
  | NonNullable<Pricing['plans']>[number]
  | NonNullable<PricingTableBlockData['inlinePlans']>[number]

export type PricingTableBlockProps = PricingTableBlockData & {
  globalPricing: Pricing | null
}

export const PricingTableBlock: React.FC<PricingTableBlockProps> = ({
  heading,
  dataSource,
  inlinePlans,
  globalPricing,
}) => {
  const title =
    heading ||
    (dataSource === 'global' ? globalPricing?.sectionTitle : null) ||
    'Packages & pricing'
  const intro = dataSource === 'global' ? globalPricing?.sectionIntro : null
  const plans =
    (dataSource === 'global' ? globalPricing?.plans : inlinePlans)?.filter(Boolean) ?? []

  if (plans.length === 0) {
    return (
      <section className="container scroll-mt-24" id="pricing">
        <p className="text-muted-foreground text-center py-12 rounded-xl border border-dashed border-border">
          Add plans in <strong>Globals → Pricing & packages</strong> (or switch this block to
          “Plans only on this page”).
        </p>
      </section>
    )
  }

  return (
    <section className="container scroll-mt-24" id="pricing">
      <div className="max-w-3xl mb-10">
        <h2 className="text-3xl font-semibold tracking-tight mb-3">{title}</h2>
        {intro ? <p className="text-muted-foreground text-lg leading-relaxed">{intro}</p> : null}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan, i) => (
          <PricingColumn key={i} plan={plan} />
        ))}
      </div>
    </section>
  )
}

function PricingColumn({ plan }: { plan: PricingPlanRow }) {
  const { name, tagline, price, priceNote, highlighted, features, link: linkFields } = plan
  const featureList = features?.map((f) => f.text).filter(Boolean) ?? []

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-8 ${
        highlighted
          ? 'border-primary shadow-lg ring-2 ring-primary/20 lg:scale-[1.02]'
          : 'border-border bg-card shadow-sm'
      }`}
    >
      {highlighted ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
          Popular
        </span>
      ) : null}
      <h3 className="text-xl font-semibold">{name}</h3>
      {tagline ? <p className="text-muted-foreground text-sm mt-1">{tagline}</p> : null}
      <p className="mt-6 text-3xl font-bold tracking-tight">{price}</p>
      {priceNote ? <p className="text-muted-foreground text-sm mt-1">{priceNote}</p> : null}
      <ul className="mt-6 flex flex-col gap-2 text-sm flex-1">
        {featureList.map((line, j) => (
          <li key={j} className="flex gap-2">
            <span className="text-primary mt-0.5">✓</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
      {linkFields?.label ? (
        <div className="mt-8">
          <CMSLink
            appearance={linkFields.appearance === 'outline' ? 'outline' : 'default'}
            className="w-full justify-center"
            label={linkFields.label}
            newTab={linkFields.newTab}
            reference={linkFields.reference}
            size="lg"
            type={linkFields.type}
            url={linkFields.url}
          />
        </div>
      ) : null}
    </div>
  )
}
