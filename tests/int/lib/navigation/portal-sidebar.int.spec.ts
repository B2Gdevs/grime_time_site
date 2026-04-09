import { describe, expect, it } from 'vitest'

import { buildPortalMainNav } from '@/lib/navigation/portalSidebar'
import {
  CUSTOMER_DASHBOARD_PATH,
  OPS_DASHBOARD_PATH,
} from '@/lib/navigation/portalPaths'

describe('portalSidebar', () => {
  it('shows only ops navigation in the staff main nav', () => {
    const items = buildPortalMainNav({
      customerScopeLabel: null,
      isRealAdmin: true,
      isStaffRoute: true,
    })

    expect(items.map((item) => item.title)).toEqual(['Ops workspace', 'Ops dashboard'])
    expect(items.map((item) => item.url)).toEqual(['/ops/workspace', OPS_DASHBOARD_PATH])
  })

  it('does not expose ops-only entries in the customer nav', () => {
    const items = buildPortalMainNav({
      customerScopeLabel: null,
      isRealAdmin: false,
      isStaffRoute: false,
    })

    expect(items.find((item) => item.title === 'Ops workspace')).toBeUndefined()
    expect(items.find((item) => item.title === 'Ops dashboard')).toBeUndefined()
    expect(items.find((item) => item.title === 'Dashboard')?.url).toBe(CUSTOMER_DASHBOARD_PATH)
  })
})
