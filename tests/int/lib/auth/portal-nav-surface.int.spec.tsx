import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { usePortalStaffRoute } from '@/lib/auth/portalNavSurface'
import { OPS_WORKSPACE_PATH } from '@/lib/navigation/portalPaths'

vi.mock('next/navigation', () => ({
  usePathname: () => OPS_WORKSPACE_PATH,
}))

function HookProbe() {
  return <div>{usePortalStaffRoute() ? 'staff' : 'customer'}</div>
}

describe('usePortalStaffRoute', () => {
  it('treats ops routes as staff routes', () => {
    render(<HookProbe />)

    expect(screen.getByText('staff')).toBeTruthy()
  })
})
