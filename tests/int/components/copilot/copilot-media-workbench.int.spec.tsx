import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CopilotMediaWorkbench } from '@/components/copilot/CopilotMediaWorkbench'

const refresh = vi.fn()
const setFocusedSessionMode = vi.fn()

const portalCopilotState = {
  authoringContext: {
    mediaSlot: {
      label: 'Hero media',
      mediaId: 12,
      mimeType: 'image/png',
      relationPath: 'hero.media',
    },
    page: {
      id: 7,
      pagePath: '/',
      slug: 'home',
      status: 'draft' as const,
      title: 'Home',
      visibility: 'public' as const,
    },
    section: {
      blockType: 'hero',
      description: 'Hero copy and media',
      index: -1,
      label: 'Hero',
      variant: 'lowImpact',
    },
    surface: 'page-composer' as const,
  },
  focusedSession: {
    mode: 'gallery' as const,
    promptHint: 'Bright exterior cleaning photo',
    type: 'media-generation' as const,
  },
  setFocusedSessionMode,
}

const mediaContextState = {
  currentPage: {
    entries: [
      {
        label: 'Hero media',
        media: {
          alt: 'Current hero image',
          filename: 'hero.png',
          id: 12,
          mimeType: 'image/png',
          previewUrl: 'https://example.com/hero.png',
          updatedAt: '2026-04-06T00:00:00.000Z',
        },
        mediaId: 12,
        pageId: 7,
        relationPath: 'hero.media',
      },
    ],
    pageId: 7,
    pagePath: '/',
    pageSlug: 'home',
    pageTitle: 'Home',
  },
  enabled: true,
}

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh,
  }),
}))

vi.mock('@/components/copilot/PortalCopilotContext', () => ({
  usePortalCopilot: () => portalCopilotState,
}))

vi.mock('@/components/admin-impersonation/PageMediaDevtoolsContext', () => ({
  usePageMediaDevtoolsOptional: () => mediaContextState,
}))

describe('CopilotMediaWorkbench', () => {
  beforeEach(() => {
    refresh.mockReset()
    setFocusedSessionMode.mockReset()
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url === '/api/internal/page-composer/media' && (!init?.method || init.method === 'GET')) {
        return {
          json: async () => ({
            items: [
              {
                alt: 'Replacement image',
                filename: 'replacement.png',
                id: 44,
                mimeType: 'image/png',
                previewUrl: 'https://example.com/replacement.png',
                updatedAt: '2026-04-06T00:00:00.000Z',
              },
            ],
          }),
          ok: true,
        } as Response
      }

      if (url === '/api/internal/page-composer/media' && init?.method === 'POST') {
        return {
          json: async () => ({ ok: true }),
          ok: true,
        } as Response
      }

      throw new Error(`Unexpected fetch: ${url}`)
    }) as typeof fetch
  })

  it('renders gallery actions inside the copilot surface and swaps media from the library', async () => {
    render(<CopilotMediaWorkbench />)

    expect(screen.getByText(/Media workbench/i)).toBeTruthy()
    expect(screen.getByText('Hero media')).toBeTruthy()

    await screen.findByText('replacement.png')

    fireEvent.click(screen.getByRole('button', { name: /use this media/i }))

    await waitFor(() => {
      expect(refresh).toHaveBeenCalled()
    })
  })
})
