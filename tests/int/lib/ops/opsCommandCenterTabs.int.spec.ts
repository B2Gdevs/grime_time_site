import { describe, expect, it } from 'vitest'

import { buildOpsTabUrl, parseOpsTabQuery } from '@/lib/ops/opsCommandCenterTabs'
import { OPS_WORKSPACE_PATH } from '@/lib/navigation/portalPaths'

describe('opsCommandCenterTabs', () => {
  it('parseOpsTabQuery accepts known tab ids', () => {
    expect(parseOpsTabQuery('crm')).toBe('crm')
    expect(parseOpsTabQuery(undefined)).toBeNull()
    expect(parseOpsTabQuery('nope')).toBeNull()
  })

  it('buildOpsTabUrl sets tab and keeps other query params', () => {
    const base = new URLSearchParams('foo=1&tab=today')
    expect(buildOpsTabUrl(base, 'scorecard')).toBe(`${OPS_WORKSPACE_PATH}?foo=1&tab=scorecard`)
  })

  it('buildOpsTabUrl works with empty search string', () => {
    expect(buildOpsTabUrl('', 'milestones')).toBe(`${OPS_WORKSPACE_PATH}?tab=milestones`)
  })
})
