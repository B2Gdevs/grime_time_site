import { describe, expect, it } from 'vitest'

import {
  parseOnlyScopes,
  resolveSeedPlanDetails,
} from '@/cli/lib/seed-plan-report'

describe('seed plan/report helpers', () => {
  it('parses comma-separated only scopes', () => {
    expect(parseOnlyScopes('pages,globals,pages')).toEqual(['pages', 'globals'])
  })

  it('rejects unknown only scopes', () => {
    expect(() => parseOnlyScopes('pages,nope')).toThrow(/Unknown scope\(s\) in --only/)
  })

  it('resolves all plus only through dependency expansion', () => {
    const plan = resolveSeedPlanDetails({
      only: 'pages,globals',
      scope: 'all',
    })

    expect(plan.requestedScopes).toEqual(['pages', 'globals'])
    expect(plan.resolvedScopes).toEqual(['foundation', 'media', 'pages', 'globals'])
    expect(plan.primaryCollections).toEqual([
      { collection: 'users', scope: 'foundation' },
      { collection: 'media', scope: 'media' },
      { collection: 'pages', scope: 'pages' },
      { collection: 'globals (header, footer, quoteSettings, …)', scope: 'globals' },
    ])
    expect(plan.sourceFiles).toContain('src/endpoints/seed/home.ts')
  })

  it('omits demo when baseline is enabled', () => {
    const plan = resolveSeedPlanDetails({
      baseline: true,
      scope: 'all',
    })

    expect(plan.resolvedScopes).not.toContain('demo')
  })

  it('rejects only when scope is not all', () => {
    expect(() =>
      resolveSeedPlanDetails({
        only: 'pages',
        scope: 'pages',
      }),
    ).toThrow(/--only can only be used with scope "all"/)
  })
})
