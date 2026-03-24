import React from 'react'

import type { ServiceGridBlock as ServiceGridBlockData } from '@/payload-types'

export const ServiceGridBlock: React.FC<ServiceGridBlockData> = ({ heading, intro, services }) => {
  const sectionId = heading?.trim().toLowerCase() === 'what we do' ? 'services' : undefined

  return (
    <section className="container scroll-mt-24" id={sectionId}>
      <div className="site-section-shell px-6 py-8 md:px-10 md:py-10">
        <div className="mb-10 max-w-3xl">
          <h2 className="mb-3 text-3xl font-semibold tracking-tight">{heading}</h2>
          {intro ? <p className="text-lg leading-relaxed text-muted-foreground">{intro}</p> : null}
        </div>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(services || []).map((row, i) => (
            <li
              key={i}
              className="rounded-2xl border border-border/80 bg-background/70 p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="mb-2 text-lg font-medium">{row.name}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{row.summary}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
