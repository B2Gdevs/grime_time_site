import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PageComposerProvider } from '@/components/admin-impersonation/PageComposerContext'
import {
  PageComposerDrawer,
  PageComposerLauncherButton,
} from '@/components/admin-impersonation/PageComposerDrawer'

const refresh = vi.fn()
const push = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push, refresh }),
}))

describe('PageComposer shell integration', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    push.mockReset()
    refresh.mockReset()
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)

      if (url.startsWith('/api/internal/page-composer?')) {
        return {
          json: async () => ({
            ok: true,
            page: {
              _status: 'draft',
              hero: { type: 'lowImpact' },
              id: 7,
              layout: [],
              pagePath: '/',
              publishedAt: null,
              slug: 'home',
              title: 'Home',
              updatedAt: '2026-04-05T00:00:00.000Z',
              visibility: 'public',
            },
            pages: [
              {
                _status: 'draft',
                id: 7,
                pagePath: '/',
                publishedAt: null,
                slug: 'home',
                title: 'Home',
                updatedAt: '2026-04-05T00:00:00.000Z',
                visibility: 'public',
              },
            ],
          }),
          ok: true,
        } as Response
      }

      if (url === '/api/internal/page-composer/media') {
        return {
          json: async () => ({ items: [] }),
          ok: true,
        } as Response
      }

      if (url === '/api/internal/shared-sections?status=published') {
        return {
          json: async () => ({ items: [] }),
          ok: true,
        } as Response
      }

      throw new Error(`Unexpected fetch: ${url}`)
    }) as typeof fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  it('opens the composer rail from a shared launcher and loads the current page', async () => {
    render(
      <PageComposerProvider>
        <PageComposerLauncherButton />
        <PageComposerDrawer enabled />
      </PageComposerProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: /page composer/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/internal/page-composer?pagePath=%2F')
    })

    expect(screen.getByText('Visual composer')).toBeTruthy()
    expect(screen.getByRole('button', { name: /close composer/i })).toBeTruthy()
    expect(screen.getByText(/the live page is the canvas/i)).toBeTruthy()
    expect(screen.queryByText(/^Preview$/i)).toBeNull()
  })
})
