import { describe, expect, it } from 'vitest'

import { buildPortalMainNav } from '@/lib/navigation/portalSidebar'

describe('portalSidebar', () => {
  it('shows only ops navigation in the staff main nav', () => {
    const items = buildPortalMainNav({
      customerScopeLabel: null,
      isRealAdmin: true,
      isStaffRoute: true,
    })

    expect(items.map((item) => item.title)).toEqual(['Ops workspace', 'Ops dashboard'])
  })

  it('does not expose ops-only entries in the customer nav', () => {
    const items = buildPortalMainNav({
      customerScopeLabel: null,
      isRealAdmin: false,
      isStaffRoute: false,
    })

    expect(items.find((item) => item.title === 'Ops workspace')).toBeUndefined()
    expect(items.find((item) => item.title === 'Ops dashboard')).toBeUndefined()
  })
})
