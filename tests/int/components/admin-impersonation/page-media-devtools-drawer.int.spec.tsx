import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  PageMediaDevtoolsProvider,
  PageMediaRegistryBridge,
} from '@/components/admin-impersonation/PageMediaDevtoolsContext'
import { PageMediaDevtoolsDrawer } from '@/components/admin-impersonation/PageMediaDevtoolsDrawer'

const refresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}))

describe('PageMediaDevtoolsDrawer', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    refresh.mockReset()
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ items: [] }),
      ok: true,
    }) as unknown as typeof fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  it('opens a focused modal from a page slot card and keeps page-slot actions condensed', async () => {
    render(
      <PageMediaDevtoolsProvider enabled>
        <PageMediaRegistryBridge
          entries={[
            {
              label: 'Hero image',
              media: {
                alt: 'Driveway hero',
                filename: 'driveway-hero.jpg',
                id: 21,
                mimeType: 'image/jpeg',
                previewUrl: '/media/driveway-hero.jpg',
                updatedAt: '2026-04-02T00:00:00.000Z',
              },
              mediaId: 21,
              pageId: 7,
              pagePath: '/',
              pageSlug: 'home',
              pageTitle: 'Home',
              relationPath: 'hero.media',
            },
          ]}
          pageId={7}
          pagePath="/"
          pageSlug="home"
          pageTitle="Home"
        />
        <PageMediaDevtoolsDrawer enabled />
      </PageMediaDevtoolsProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: /page media/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/internal/dev/page-media', { method: 'GET' })
    })

    expect(screen.queryByRole('button', { name: /^replace$/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /^upload$/i })).toBeNull()

    fireEvent.click(screen.getByText('Hero image'))

    expect(screen.getByText('Replace the media shown in this slot without leaving the page.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Upload from device' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Image' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Video' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Gallery' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy()
  })
})
