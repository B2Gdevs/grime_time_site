import { describe, expect, it } from 'vitest'

import { projectExistingForSeed, seedDataMatchesExisting } from '@/endpoints/seed/diff'

describe('seed diff helpers', () => {
  it('projects only seeded keys from an existing document', () => {
    const existing = {
      id: 'page-1',
      slug: 'home',
      title: 'Home',
      updatedAt: '2026-04-01T00:00:00.000Z',
      hero: {
        label: 'Welcome',
        theme: 'dark',
      },
    }

    const template = {
      slug: 'home',
      hero: {
        label: 'Welcome',
      },
    }

    expect(projectExistingForSeed(existing, template)).toEqual({
      slug: 'home',
      hero: {
        label: 'Welcome',
      },
    })
  })

  it('treats relation objects and scalar ids as equivalent seed values', () => {
    const existing = {
      authors: [
        {
          id: 'user-1',
          email: 'owner@example.com',
        },
      ],
      relatedPosts: [
        {
          id: 'post-2',
          slug: 'another-post',
        },
      ],
    }

    const template = {
      authors: ['user-1'],
      relatedPosts: ['post-2'],
    }

    expect(seedDataMatchesExisting(existing, template)).toBe(true)
  })

  it('detects real seed data changes', () => {
    const existing = {
      title: 'Driveway Wash',
      status: 'active',
      steps: [{ title: 'Call back', waitDays: 1 }],
    }

    const template = {
      title: 'Driveway Wash',
      status: 'paused',
      steps: [{ title: 'Call back', waitDays: 1 }],
    }

    expect(seedDataMatchesExisting(existing, template)).toBe(false)
  })

  it('treats stored nulls like missing optional seed fields', () => {
    const existing = {
      title: 'Projected revenue',
      manualValue: null,
      manualValueLabel: null,
    }

    const template = {
      title: 'Projected revenue',
      manualValue: undefined,
      manualValueLabel: undefined,
    }

    expect(seedDataMatchesExisting(existing, template)).toBe(true)
  })
})
