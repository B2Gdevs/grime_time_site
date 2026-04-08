import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { usePortalStaffRoute } from '@/lib/auth/portalNavSurface'

vi.mock('next/navigation', () => ({
  usePathname: () => '/ops/workspace',
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
