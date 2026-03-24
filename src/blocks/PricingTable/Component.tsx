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
        <div className="site-section-shell px-6 py-10">
          <p className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
            Add plans in <strong>Globals -&gt; Pricing &amp; packages</strong> or switch this block
            to &quot;Plans only on this page.&quot;
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="container scroll-mt-24" id="pricing">
      <div className="site-section-shell px-6 py-8 md:px-10 md:py-10">
        <div className="mb-10 max-w-3xl">
          <h2 className="mb-3 text-3xl font-semibold tracking-tight">{title}</h2>
          {intro ? <p className="text-lg leading-relaxed text-muted-foreground">{intro}</p> : null}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <PricingColumn key={i} plan={plan} />
          ))}
        </div>
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
      {tagline ? <p className="mt-1 text-sm text-muted-foreground">{tagline}</p> : null}
      <p className="mt-6 text-3xl font-bold tracking-tight">{price}</p>
      {priceNote ? <p className="mt-1 text-sm text-muted-foreground">{priceNote}</p> : null}
      <ul className="mt-6 flex flex-1 flex-col gap-2 text-sm">
        {featureList.map((line, j) => (
          <li key={j} className="flex gap-2">
            <span className="mt-0.5 text-primary">+</span>
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
