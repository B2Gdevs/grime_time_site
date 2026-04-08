import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const push = vi.fn()
const refresh = vi.fn()
const composerState = {
  activePagePath: null as null | string,
  activeTab: 'structure' as 'content' | 'media' | 'pages' | 'structure',
  close: vi.fn(),
  isOpen: false,
  open: vi.fn(),
  previewMode: 'desktop' as const,
  selectedIndex: 0,
  setActivePagePath: vi.fn(),
  setActiveTab: vi.fn(),
  setOpen: vi.fn(),
  setPreviewMode: vi.fn(),
  setSelectedIndex: vi.fn(),
  toggle: vi.fn(),
}

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push,
    refresh,
  }),
}))

vi.mock('@/components/admin-impersonation/PageComposerContext', () => ({
  usePageComposerOptional: () => composerState,
}))

describe('SiteOperatorToolsPanel', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    push.mockReset()
    refresh.mockReset()
    composerState.isOpen = false
    composerState.activePagePath = null
    composerState.activeTab = 'structure'
    composerState.open.mockReset()
    composerState.open.mockImplementation(() => {
      composerState.isOpen = true
    })
    composerState.close.mockReset()
    composerState.close.mockImplementation(() => {
      composerState.isOpen = false
      composerState.activePagePath = null
    })
    composerState.setActivePagePath.mockReset()
    composerState.setActivePagePath.mockImplementation((value) => {
      composerState.activePagePath = value
    })
    composerState.setActiveTab.mockReset()
    composerState.setActiveTab.mockImplementation((value) => {
      composerState.activeTab = value
    })
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
    expect(screen.getByRole('link', { name: /ops/i }).getAttribute('href')).toBe('/ops')
    expect(screen.getByRole('link', { name: /dashboard/i }).getAttribute('href')).toBe('/dashboard')
    expect(screen.getByRole('switch', { name: /enable visual composer/i })).toBeTruthy()
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

  it('toggles the visual composer for the current page from the tools panel', async () => {
    const { SiteOperatorToolsPanel } = await import('@/components/admin-impersonation/SiteOperatorToolsPanel')

    const view = render(
      <SiteOperatorToolsPanel
        effectiveUser={{ email: 'preview@grimetime.app', id: 1, name: 'Preview User' }}
        realUser={{ email: 'admin@grimetime.app', id: 7, name: 'Real Admin' }}
      />,
    )

    screen.getByRole('switch', { name: /enable visual composer/i }).click()

    expect(composerState.setActivePagePath).toHaveBeenCalledWith('/')
    expect(composerState.setActiveTab).toHaveBeenCalledWith('content')
    expect(composerState.open).toHaveBeenCalled()

    view.rerender(
      <SiteOperatorToolsPanel
        effectiveUser={{ email: 'preview@grimetime.app', id: 1, name: 'Preview User' }}
        realUser={{ email: 'admin@grimetime.app', id: 7, name: 'Real Admin' }}
      />,
    )

    expect(screen.getByText(/live page editing is enabled here/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /^content$/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /^media$/i })).toBeNull()

    screen.getByRole('switch', { name: /disable visual composer/i }).click()

    expect(composerState.close).toHaveBeenCalled()
  })
})
