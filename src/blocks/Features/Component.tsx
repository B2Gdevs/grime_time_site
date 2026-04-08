import type { Page } from '@/payload-types'

type FeaturesBlock = Extract<NonNullable<Page['layout']>[number], { blockType: 'features' }>

type FeatureCard = NonNullable<FeaturesBlock['features']>[number]

export function FeaturesBlock(props: FeaturesBlock) {
  const cards = (props.features || []).filter((card): card is FeatureCard => Boolean(card?.title?.trim()))

  if (cards.length === 0) {
    return null
  }

  return (
    <section className="container my-16 scroll-mt-24">
      <div className="site-section-shell px-6 py-8 md:px-10 md:py-10">
        <div className="mb-8 max-w-3xl">
          {props.eyebrow ? (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
              {props.eyebrow}
            </p>
          ) : null}
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{props.heading}</h2>
          {props.intro ? <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{props.intro}</p> : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card, index) => (
            <article
              className="rounded-[1.5rem] border border-border/80 bg-background/82 p-5 shadow-[0_10px_30px_-24px_rgba(2,6,23,0.45)]"
              key={`${card.title}-${index}`}
            >
              {card.eyebrow ? (
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80">
                  {card.eyebrow}
                </p>
              ) : null}
              <h3 className="mt-2 text-xl font-semibold tracking-tight">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{card.summary}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
