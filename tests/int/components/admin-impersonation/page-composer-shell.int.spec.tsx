import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PageComposerProvider } from '@/components/admin-impersonation/PageComposerContext'
import {
  PageComposerDrawer,
  PageComposerLauncherButton,
} from '@/components/admin-impersonation/PageComposerDrawer'
import { usePageComposer } from '@/components/admin-impersonation/PageComposerContext'

const refresh = vi.fn()
const push = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push, refresh }),
}))

function PublishTabHarness() {
  const composer = usePageComposer()

  return (
    <button onClick={() => composer.setActiveTab('publish')} type="button">
      Open publish tab
    </button>
  )
}

describe('PageComposer shell integration', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    push.mockReset()
    refresh.mockReset()
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method || 'GET'

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
            versions: [
              {
                createdAt: '2026-04-05T00:00:00.000Z',
                id: 'version-1',
                latest: true,
                pagePath: '/',
                slug: 'home',
                status: 'draft',
                title: 'Home',
                updatedAt: '2026-04-05T00:00:00.000Z',
              },
            ],
          }),
          ok: true,
        } as Response
      }

      if (url === '/api/internal/page-composer' && method === 'POST') {
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
            versions: [
              {
                createdAt: '2026-04-05T00:00:00.000Z',
                id: 'version-1',
                latest: true,
                pagePath: '/',
                slug: 'home',
                status: 'draft',
                title: 'Home',
                updatedAt: '2026-04-05T00:00:00.000Z',
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
    cleanup()
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  it('opens the floating composer panel from a shared launcher and loads the current page', async () => {
    render(
      <PageComposerProvider>
        <PageComposerLauncherButton />
        <PublishTabHarness />
        <PageComposerDrawer enabled />
      </PageComposerProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: /page composer/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/internal/page-composer?pagePath=%2F')
    })

    expect(screen.getByText('Visual composer')).toBeTruthy()
    expect(screen.getByRole('button', { name: /dismiss page composer/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /move page composer/i })).toBeTruthy()
    expect(screen.getByText(/composer admin bar/i)).toBeTruthy()
    expect(screen.queryByText(/the live page is the canvas/i)).toBeNull()
    expect(screen.getByDisplayValue('Home')).toBeTruthy()
    expect(screen.queryByText(/^Preview$/i)).toBeNull()
    const composer = screen.getByRole('complementary')
    expect(composer).toBeTruthy()
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(composer.className).toContain('rounded-[2rem]')
  })

  it('restores a page version from the publish tab', async () => {
    const originalConfirm = window.confirm
    window.confirm = vi.fn().mockReturnValue(true)

    render(
      <PageComposerProvider>
        <PageComposerLauncherButton />
        <PublishTabHarness />
        <PageComposerDrawer enabled />
      </PageComposerProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: /page composer/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/internal/page-composer?pagePath=%2F')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Open publish tab' }))
    fireEvent.click(screen.getByRole('button', { name: 'Restore draft' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/internal/page-composer',
        expect.objectContaining({
          method: 'POST',
        }),
      )
    })

    const restoreRequest = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.find(
      ([url, init]) =>
        url === '/api/internal/page-composer' &&
        typeof init?.body === 'string' &&
        JSON.parse(init.body).action === 'restore-page-version',
    )
    expect(restoreRequest).toBeTruthy()

    window.confirm = originalConfirm
  })
})
