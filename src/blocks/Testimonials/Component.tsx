import type { Config, Page } from '@/payload-types'

import { TestimonialsBlockClient } from '@/blocks/Testimonials/TestimonialsBlockClient'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

type Testimonial = Config['collections']['testimonials']
type TestimonialsSectionBlock = Extract<
  NonNullable<Page['layout']>[number],
  { blockType: 'testimonialsBlock' }
>

async function loadLatestPublished(limit: number): Promise<Testimonial[]> {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'testimonials',
    depth: 1,
    limit,
    overrideAccess: false,
    sort: 'sortOrder',
    where: {
      published: { equals: true },
    },
  })
  return docs as Testimonial[]
}

export async function TestimonialsBlock(props: TestimonialsSectionBlock) {
  const { heading, intro, selectionMode, testimonials: selected, limit } = props

  let items: Testimonial[] = []
  if (selectionMode === 'featuredLatest') {
    items = await loadLatestPublished(limit ?? 6)
  } else if (selected && Array.isArray(selected) && selected.length > 0) {
    items = selected.filter((item): item is Testimonial => typeof item === 'object' && item !== null)
  }

  items = items.filter((item) => item.published)

  if (items.length === 0) {
    return null
  }

  return <TestimonialsBlockClient heading={heading} intro={intro} items={items} />
}
