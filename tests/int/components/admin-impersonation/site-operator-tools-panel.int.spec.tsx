import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CUSTOMER_DASHBOARD_PATH,
  OPS_DASHBOARD_PATH,
} from '@/lib/navigation/portalPaths'

const push = vi.fn()
const refresh = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push,
    refresh,
  }),
}))

describe('SiteOperatorToolsPanel', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    push.mockReset()
    refresh.mockReset()
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)

      if (url.startsWith('/api/internal/impersonation/users?')) {
        return {
          json: async () => ({
            users: [
              {
                accountName: 'Acme account',
                company: 'Acme',
                email: 'customer@example.com',
                id: 42,
                name: 'Customer Preview',
              },
            ],
          }),
          ok: true,
        } as Response
      }

      throw new Error(`Unexpected fetch: ${url}`)
    }) as typeof fetch
  })

  afterEach(() => {
    cleanup()
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  it('shows page-authoring controls and impersonation search inside one tools panel', async () => {
    const { SiteOperatorToolsPanel } = await import('@/components/admin-impersonation/SiteOperatorToolsPanel')

    render(
      <SiteOperatorToolsPanel
        effectiveUser={{ email: 'preview@grimetime.app', id: 1, name: 'Preview User' }}
        realUser={{ email: 'admin@grimetime.app', id: 7, name: 'Real Admin' }}
      />,
    )

    expect(screen.getByText('Operator tools')).toBeTruthy()
    expect(screen.getByRole('link', { name: /home/i }).getAttribute('href')).toBe('/')
    expect(screen.getByRole('link', { name: /ops/i }).getAttribute('href')).toBe(OPS_DASHBOARD_PATH)
    expect(screen.getByRole('link', { name: /dashboard/i }).getAttribute('href')).toBe(
      CUSTOMER_DASHBOARD_PATH,
    )
    expect(screen.queryByRole('switch', { name: /live page editing/i })).toBeNull()
    expect(screen.getByText(/signed in as/i)).toBeTruthy()
    expect(screen.getByText(/admin direct view/i)).toBeTruthy()
    expect(screen.getByText('Search users')).toBeTruthy()
    expect(await screen.findByText('Customer Preview')).toBeTruthy()
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
    expect(screen.queryByRole('button', { name: /^content$/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /^media$/i })).toBeNull()
  })

})
