import { describe, expect, it } from 'vitest'

import { composerPagePathForPathname } from '@/lib/pages/pageComposerLiveRoute'

describe('composerPagePathForPathname', () => {
  it('returns the pathname for normal marketing routes', () => {
    expect(composerPagePathForPathname('/services')).toBe('/services')
    expect(composerPagePathForPathname('/about')).toBe('/about')
  })

  it('maps secured admin surfaces to home', () => {
    expect(composerPagePathForPathname('/admin')).toBe('/')
    expect(composerPagePathForPathname('/admin/foo')).toBe('/')
    expect(composerPagePathForPathname('/docs')).toBe('/')
    expect(composerPagePathForPathname('/docs/bar')).toBe('/')
    expect(composerPagePathForPathname('/ops')).toBe('/')
    expect(composerPagePathForPathname('/ops/baz')).toBe('/')
    expect(composerPagePathForPathname('/portal/ops/dashboard')).toBe('/')
    expect(composerPagePathForPathname('/portal/ops/workspace')).toBe('/')
  })
})
