import { describe, expect, it } from 'vitest'

import {
  EXPECTED_CATEGORY_SLUGS,
  EXPECTED_POST_SLUGS,
  EXPECTED_SEED_MEDIA_FILENAMES,
} from '@/endpoints/seed/expectations'
import { SEED_CATEGORIES, SEED_MEDIA, SEED_POST_SLUGS } from '@/endpoints/seed/orchestrate-push'

describe('seed expectations vs orchestrate-push', () => {
  it('media filenames match SEED_MEDIA', () => {
    const fromPush = SEED_MEDIA.map((m) => m.filename)
    expect([...EXPECTED_SEED_MEDIA_FILENAMES]).toEqual(fromPush)
  })

  it('category slugs match SEED_CATEGORIES', () => {
    const fromPush = SEED_CATEGORIES.map((c: { slug: string }) => c.slug)
    expect([...EXPECTED_CATEGORY_SLUGS]).toEqual(fromPush)
  })

  it('post slugs match SEED_POST_SLUGS', () => {
    expect([...EXPECTED_POST_SLUGS]).toEqual([...SEED_POST_SLUGS])
  })
})
