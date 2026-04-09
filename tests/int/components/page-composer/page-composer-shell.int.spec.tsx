import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PAGE_COMPOSER_TOOLBAR_EVENT, PageComposerProvider } from '@/components/page-composer/PageComposerContext'
import { PageComposerDrawer } from '@/components/page-composer/PageComposerDrawer'
import { usePageComposer } from '@/components/page-composer/PageComposerContext'

const refresh = vi.fn()
const push = vi.fn()
let pathname = '/'

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push, refresh }),
}))

function PagesTabHarness() {
  const composer = usePageComposer()

  return (
    <>
      <button onClick={() => composer.setActiveTab('media')} type="button">
        Open media tab
      </button>
      <button onClick={() => composer.setActiveTab('pages')} type="button">
        Open pages tab
      </button>
      <div data-testid="active-page-path">{composer.activePagePath || ''}</div>
    </>
  )
}

describe('PageComposer shell integration', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    pathname = '/'
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
        <PagesTabHarness />
        <PageComposerDrawer enabled />
      </PageComposerProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: /page composer/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/internal/page-composer?pagePath=%2F')
    })

    expect(screen.getByTestId('active-page-path').textContent).toBe('/')
    expect(screen.getByText('Visual composer')).toBeTruthy()
    expect(screen.getByRole('button', { name: /dismiss page composer/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /move page composer/i })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Layout' })).toBeTruthy()
    expect(screen.getByText(/selected block/i)).toBeTruthy()
    expect(screen.queryByText(/the live page is the canvas/i)).toBeNull()
    expect(screen.queryByText(/^Preview$/i)).toBeNull()
    const composer = screen.getByRole('complementary')
    expect(composer).toBeTruthy()
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(composer.className).toContain('rounded-[2rem]')
  })

  it('restores a page version from the Pages tab (History sub-tab)', async () => {
    const originalConfirm = window.confirm
    window.confirm = vi.fn().mockReturnValue(true)

    render(
      <PageComposerProvider>
        <PagesTabHarness />
        <PageComposerDrawer enabled />
      </PageComposerProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: /page composer/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/internal/page-composer?pagePath=%2F')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Open pages tab' }))
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

  it('keeps the current route as the composer source of truth for a missing page', async () => {
    pathname = '/fresh-route'
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method || 'GET'

      if (url === '/api/internal/page-composer?pagePath=%2Ffresh-route') {
        return {
          json: async () => ({
            ok: true,
            page: {
              _status: 'draft',
              hero: { type: 'lowImpact' },
              id: null,
              layout: [],
              pagePath: '/fresh-route',
              publishedAt: null,
              slug: 'fresh-route',
              title: 'Fresh Route',
              updatedAt: null,
              visibility: 'public',
            },
            versions: [],
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

      throw new Error(`Unexpected fetch: ${url} (${method})`)
    }) as typeof fetch

    render(
      <PageComposerProvider>
        <PageComposerDrawer enabled />
      </PageComposerProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: /page composer/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/internal/page-composer?pagePath=%2Ffresh-route')
    })

    expect(screen.getByText('Visual composer')).toBeTruthy()
    expect(screen.getByText(/selected block/i)).toBeTruthy()
    expect(screen.queryByText(/select a page/i)).toBeNull()
  })

  it('binds the floating launcher to non-home marketing routes so live canvas chrome can attach', async () => {
    pathname = '/contact'
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)

      if (url === '/api/internal/page-composer?pagePath=%2Fcontact') {
        return {
          json: async () => ({
            ok: true,
            page: {
              _status: 'draft',
              hero: { type: 'mediumImpact' },
              id: 12,
              layout: [],
              pagePath: '/contact',
              publishedAt: null,
              slug: 'contact',
              title: 'Contact',
              updatedAt: '2026-04-08T00:00:00.000Z',
              visibility: 'public',
            },
            versions: [],
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

      throw new Error(`Unexpected fetch: ${url}`)
    }) as typeof fetch

    render(
      <PageComposerProvider>
        <PagesTabHarness />
        <PageComposerDrawer enabled />
      </PageComposerProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: /page composer/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/internal/page-composer?pagePath=%2Fcontact')
    })

    expect(screen.getByTestId('active-page-path').textContent).toBe('/contact')
  })

  it('does not show the composer launcher on non-CMS frontend routes', () => {
    pathname = '/search'

    render(
      <PageComposerProvider>
        <PageComposerDrawer enabled />
      </PageComposerProvider>,
    )

    expect(screen.queryByRole('button', { name: /page composer/i })).toBeNull()
  })

  it('keeps published-page draft saves on the current route instead of cloning or pushing a new route', async () => {
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method || 'GET'

      if (url === '/api/internal/page-composer?pagePath=%2F') {
        return {
          json: async () => ({
            ok: true,
            page: {
              _status: 'published',
              hero: { type: 'lowImpact' },
              id: 7,
              layout: [],
              pagePath: '/',
              publishedAt: '2026-04-05T00:00:00.000Z',
              slug: 'home',
              title: 'Home',
              updatedAt: '2026-04-05T00:00:00.000Z',
              visibility: 'public',
            },
            pages: [],
            versions: [],
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
              pagePath: '/home-updated',
              publishedAt: '2026-04-05T00:00:00.000Z',
              slug: 'home-updated',
              title: 'Home Updated',
              updatedAt: '2026-04-05T00:00:00.000Z',
              visibility: 'public',
            },
            pages: [],
            versions: [],
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

      throw new Error(`Unexpected fetch: ${url} (${method})`)
    }) as typeof fetch

    render(
      <PageComposerProvider>
        <PageComposerDrawer enabled />
      </PageComposerProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: /page composer/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/internal/page-composer?pagePath=%2F')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))

    await waitFor(
      () => {
        const saveDraftRequest = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.find(
          ([url, init]) =>
            url === '/api/internal/page-composer' &&
            typeof init?.body === 'string' &&
            JSON.parse(init.body).action === 'save-draft',
        )

        expect(saveDraftRequest).toBeTruthy()
      },
      { timeout: 4000 },
    )

    expect(
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.find(
        ([url, init]) =>
          url === '/api/internal/page-composer' &&
          typeof init?.body === 'string' &&
          JSON.parse(init.body).action === 'clone-page',
      ),
    ).toBeFalsy()
    expect(push).not.toHaveBeenCalled()
  })

  it('targets the requested service lane in the media tab and assigns library media from the gallery', async () => {
    let toolbarDetail: null | Record<string, unknown> = null
    const handleToolbarChange = (event: Event) => {
      toolbarDetail = (event as CustomEvent).detail as Record<string, unknown>
    }

    window.addEventListener(PAGE_COMPOSER_TOOLBAR_EVENT, handleToolbarChange as EventListener)

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method || 'GET'

      if (url === '/api/internal/page-composer?pagePath=%2F') {
        return {
          json: async () => ({
            ok: true,
            page: {
              _status: 'draft',
              hero: { type: 'lowImpact' },
              id: 7,
              layout: [
                {
                  blockName: 'Intro media',
                  blockType: 'mediaBlock',
                  media: null,
                },
                {
                  blockType: 'serviceGrid',
                  heading: 'What we do',
                  intro: 'Exterior cleaning lanes.',
                  services: [
                    {
                      media: null,
                      name: 'House washing',
                      summary: 'Wash siding.',
                    },
                    {
                      media: null,
                      name: 'Driveway lane',
                      summary: 'Clean flatwork.',
                    },
                  ],
                },
              ],
              pagePath: '/',
              publishedAt: null,
              slug: 'home',
              title: 'Home',
              updatedAt: '2026-04-05T00:00:00.000Z',
              visibility: 'public',
            },
            pages: [],
            versions: [],
          }),
          ok: true,
        } as Response
      }

      if (url === '/api/internal/page-composer/media' && method === 'GET') {
        return {
          json: async () => ({
            items: [
              {
                alt: 'Fresh exterior shot',
                filename: 'fresh-exterior.jpg',
                id: 901,
                media: {
                  alt: 'Fresh exterior shot',
                  createdAt: '2026-04-05T00:00:00.000Z',
                  filename: 'fresh-exterior.jpg',
                  height: 900,
                  id: 901,
                  mimeType: 'image/jpeg',
                  updatedAt: '2026-04-05T00:00:00.000Z',
                  url: '/media/fresh-exterior.jpg',
                  width: 1600,
                },
                mimeType: 'image/jpeg',
                previewUrl: '/media/fresh-exterior.jpg',
                updatedAt: '2026-04-05T00:00:00.000Z',
              },
            ],
          }),
          ok: true,
        } as Response
      }

      if (url === '/api/internal/page-composer/media' && method === 'POST') {
        return {
          json: async () => ({
            media: {
              alt: 'Fresh exterior shot',
              id: 901,
            },
            mediaId: 901,
            ok: true,
            pageId: 7,
          }),
          ok: true,
        } as Response
      }
      throw new Error(`Unexpected fetch: ${url} (${method})`)
    }) as typeof fetch

    render(
      <PageComposerProvider>
        <PageComposerDrawer enabled />
      </PageComposerProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: /page composer/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/internal/page-composer?pagePath=%2F')
      expect(toolbarDetail && typeof toolbarDetail.onOpenMediaSlot).toBe('function')
    })

    act(() => {
      ;(toolbarDetail?.onOpenMediaSlot as (relationPath: string) => void)('layout.1.services.1.media')
    })

    await waitFor(() => {
      expect(toolbarDetail?.selectedMediaRelationPath).toBe('layout.1.services.1.media')
    })

    fireEvent.click(screen.getByRole('tab', { name: 'Media' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Use media 901 for What we do: Driveway lane' })).toBeTruthy()
    })

    expect(screen.queryByText('Recent media')).toBeNull()
    expect(screen.getByRole('button', { name: 'What we do: House washing' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'What we do: Driveway lane' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Generate and swap' })).toBeTruthy()
    expect(screen.getByText(/Targeting/)).toBeTruthy()
    expect(screen.getAllByText(/Driveway lane/).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: 'Use media 901 for What we do: Driveway lane' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/internal/page-composer/media',
        expect.objectContaining({
          method: 'POST',
        }),
      )
    })

    expect(screen.getByText(/Targeting/)).toBeTruthy()
    expect(screen.getAllByText(/Driveway lane/).length).toBeGreaterThan(0)

    window.removeEventListener(PAGE_COMPOSER_TOOLBAR_EVENT, handleToolbarChange as EventListener)
  })

  it('syncs the drawer media selection immediately when canvas drag-drop stages a slot update', async () => {
    let toolbarDetail: null | Record<string, unknown> = null
    const handleToolbarChange = (event: Event) => {
      toolbarDetail = (event as CustomEvent).detail as Record<string, unknown>
    }

    window.addEventListener(PAGE_COMPOSER_TOOLBAR_EVENT, handleToolbarChange as EventListener)

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method || 'GET'

      if (url === '/api/internal/page-composer?pagePath=%2F') {
        return {
          json: async () => ({
            ok: true,
            page: {
              _status: 'draft',
              hero: { type: 'lowImpact' },
              id: 7,
              layout: [
                {
                  blockType: 'heroBlock',
                  type: 'lowImpact',
                },
                {
                  blockType: 'serviceGrid',
                  heading: 'What we do',
                  intro: 'Exterior cleaning lanes.',
                  services: [
                    {
                      media: null,
                      name: 'House washing',
                      summary: 'Wash siding.',
                    },
                    {
                      media: null,
                      name: 'Driveway lane',
                      summary: 'Clean flatwork.',
                    },
                  ],
                },
              ],
              pagePath: '/',
              publishedAt: null,
              slug: 'home',
              title: 'Home',
              updatedAt: '2026-04-05T00:00:00.000Z',
              visibility: 'public',
            },
            pages: [],
            versions: [],
          }),
          ok: true,
        } as Response
      }

      if (url === '/api/internal/page-composer/media' && method === 'GET') {
        return {
          json: async () => ({
            items: [
              {
                alt: 'Fresh exterior shot',
                filename: 'fresh-exterior.jpg',
                id: 901,
                media: {
                  alt: 'Fresh exterior shot',
                  createdAt: '2026-04-05T00:00:00.000Z',
                  filename: 'fresh-exterior.jpg',
                  height: 900,
                  id: 901,
                  mimeType: 'image/jpeg',
                  updatedAt: '2026-04-05T00:00:00.000Z',
                  url: '/media/fresh-exterior.jpg',
                  width: 1600,
                },
                mimeType: 'image/jpeg',
                previewUrl: '/media/fresh-exterior.jpg',
                updatedAt: '2026-04-05T00:00:00.000Z',
              },
            ],
          }),
          ok: true,
        } as Response
      }

      throw new Error(`Unexpected fetch: ${url} (${method})`)
    }) as typeof fetch

    render(
      <PageComposerProvider>
        <PagesTabHarness />
        <PageComposerDrawer enabled />
      </PageComposerProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: /page composer/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/internal/page-composer?pagePath=%2F')
      expect(toolbarDetail && typeof toolbarDetail.onStageMediaSlot).toBe('function')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Open media tab' }))

    act(() => {
      ;(
        toolbarDetail?.onStageMediaSlot as (media: Record<string, unknown>, relationPath: string) => void
      )(
        {
          alt: 'Fresh exterior shot',
          filename: 'fresh-exterior.jpg',
          id: 901,
          mimeType: 'image/jpeg',
          updatedAt: '2026-04-05T00:00:00.000Z',
          url: '/media/fresh-exterior.jpg',
        },
        'layout.1.services.0.media',
      )
    })

    await waitFor(() => {
      expect(toolbarDetail?.selectedMediaRelationPath).toBe('layout.1.services.0.media')
      expect(screen.getByText(/Targeting/)).toBeTruthy()
      expect(screen.getByRole('button', { name: 'What we do: House washing' })).toBeTruthy()
      expect(screen.getAllByAltText('Fresh exterior shot').length).toBeGreaterThan(0)
      expect(screen.getAllByText(/fresh-exterior\.jpg/).length).toBeGreaterThan(0)
    })

    window.removeEventListener(PAGE_COMPOSER_TOOLBAR_EVENT, handleToolbarChange as EventListener)
  })
})

