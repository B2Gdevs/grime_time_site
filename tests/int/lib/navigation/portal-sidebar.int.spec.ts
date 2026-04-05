import { describe, expect, it } from 'vitest'

import { buildPortalMainNav } from '@/lib/navigation/portalSidebar'

describe('portalSidebar', () => {
  it('includes shared sections in the staff main nav', () => {
    const items = buildPortalMainNav({
      customerScopeLabel: null,
      isRealAdmin: true,
      isStaffRoute: true,
    })

    expect(items.map((item) => item.title)).toEqual(['Ops workspace', 'Ops dashboard', 'Shared sections'])
    expect(items.find((item) => item.title === 'Shared sections')?.url).toBe('/shared-sections')
  })

  it('does not expose shared sections in the customer nav', () => {
    const items = buildPortalMainNav({
      customerScopeLabel: null,
      isRealAdmin: false,
      isStaffRoute: false,
    })

    expect(items.find((item) => item.title === 'Shared sections')).toBeUndefined()
  })
})
