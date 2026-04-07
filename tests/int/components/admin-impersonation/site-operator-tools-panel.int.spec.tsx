import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const push = vi.fn()
const refresh = vi.fn()
const composerState = {
  activeTab: 'structure' as 'content' | 'publish' | 'structure',
  activePagePath: null as null | string,
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
    composerState.activeTab = 'structure'
    composerState.open.mockReset()
    composerState.close.mockReset()
    composerState.setActivePagePath.mockReset()
    composerState.setActiveTab.mockReset()
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
    expect(screen.getByRole('button', { name: /open content tools/i })).toBeTruthy()
    expect(screen.getByText(/signed in as/i)).toBeTruthy()
    expect(screen.getByText(/admin direct view/i)).toBeTruthy()
    expect(screen.getByText('Search users')).toBeTruthy()
    expect(await screen.findByText('Customer Preview')).toBeTruthy()
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  it('opens content tools from the tools panel without exposing a composer switch', async () => {
    const { SiteOperatorToolsPanel } = await import('@/components/admin-impersonation/SiteOperatorToolsPanel')

    render(
      <SiteOperatorToolsPanel
        effectiveUser={{ email: 'preview@grimetime.app', id: 1, name: 'Preview User' }}
        realUser={{ email: 'admin@grimetime.app', id: 7, name: 'Real Admin' }}
      />,
    )

    const [openContentToolsButton] = screen.getAllByRole('button', { name: /open content tools/i })
    openContentToolsButton.click()

    expect(composerState.setActivePagePath).toHaveBeenCalledWith('/')
    expect(composerState.setActiveTab).toHaveBeenCalledWith('content')
    expect(composerState.open).toHaveBeenCalled()
  })
})
