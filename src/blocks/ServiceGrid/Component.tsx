import React from 'react'

import type { ServiceGridBlock as ServiceGridBlockData } from '@/payload-types'

export const ServiceGridBlock: React.FC<ServiceGridBlockData> = ({ heading, intro, services }) => {
  return (
    <section className="container scroll-mt-24" id="services">
      <div className="max-w-3xl mb-10">
        <h2 className="text-3xl font-semibold tracking-tight mb-3">{heading}</h2>
        {intro ? <p className="text-muted-foreground text-lg leading-relaxed">{intro}</p> : null}
      </div>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(services || []).map((row, i) => (
          <li
            key={i}
            className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <h3 className="text-lg font-medium mb-2">{row.name}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{row.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
