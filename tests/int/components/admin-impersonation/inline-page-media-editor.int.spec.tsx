import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/constants/copilotFeatures', () => ({
  COPILOT_MEDIA_GENERATION_ENABLED: true,
}))

import { InlinePageMediaEditor } from '@/components/admin-impersonation/InlinePageMediaEditor'
import {
  PAGE_COMPOSER_MEDIA_DRAG_MIME,
  PAGE_COMPOSER_MEDIA_DRAG_PAYLOAD_MIME,
} from '@/lib/pages/pageComposerMediaDrag'

const refresh = vi.fn()
const onOpenMediaSlot = vi.fn()
const onStageMediaSlot = vi.fn()
const openFocusedMediaSession = vi.fn()
const setAuthoringContext = vi.fn()

const mediaContextState = {
  currentPage: {
    entries: [],
    pageId: 7,
    pagePath: '/',
    pageSlug: 'home',
    pageTitle: 'Home',
  },
  enabled: true,
}

const toolbarState = {
  draftPage: {
    _status: 'draft' as const,
    hero: { type: 'lowImpact' as const },
    id: 9,
    layout: [
      {
        blockType: 'serviceGrid' as const,
        heading: 'What we do',
        services: [
          {
            media: null,
            name: 'House washing',
            summary: 'Exterior cleaning.',
          },
        ],
      },
    ],
    pagePath: '/',
    slug: 'home',
    title: 'Home',
    visibility: 'public' as const,
  },
  onOpenMediaSlot,
  onStageMediaSlot,
  sectionSummaries: [
    {
      badges: [],
      blockType: 'serviceGrid',
      category: 'reusable',
      description: 'Interactive service lane',
      hidden: false,
      identity: 'id:service-grid',
      index: 0,
      label: 'What we do',
      variant: 'interactive',
    },
  ],
}

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}))

vi.mock('@/components/page-composer/PageComposerCanvas', () => ({
  usePageComposerCanvasToolbarState: () => toolbarState,
}))

vi.mock('@/components/admin-impersonation/PageMediaDevtoolsContext', () => ({
  usePageMediaDevtoolsOptional: () => mediaContextState,
}))

vi.mock('@/components/copilot/PortalCopilotContext', () => ({
  usePortalCopilotOptional: () => ({
    openFocusedMediaSession,
    setAuthoringContext,
  }),
}))

describe('InlinePageMediaEditor', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    refresh.mockReset()
    onOpenMediaSlot.mockReset()
    onStageMediaSlot.mockReset()
    openFocusedMediaSession.mockReset()
    setAuthoringContext.mockReset()
    mediaContextState.currentPage.entries = []
    toolbarState.draftPage.layout[0]!.services[0]!.media = null

    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ ok: true }),
      ok: true,
    }) as unknown as typeof fetch
  })

  afterEach(() => {
    cleanup()
    global.fetch = originalFetch
  })

  it('stages dropped library media into the current draft when the route registry is stale', async () => {
    render(
      <InlinePageMediaEditor relationPath="layout.0.services.0.media">
        <div>Drop zone</div>
      </InlinePageMediaEditor>,
    )

    expect(screen.getByRole('button', { name: 'Replace' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Generate' })).toBeTruthy()
    expect(screen.getByText('What we do: House washing')).toBeTruthy()

    fireEvent.drop(screen.getByText('Drop zone').parentElement as HTMLElement, {
      dataTransfer: {
        files: [],
        getData: (type: string) => {
          if (type === PAGE_COMPOSER_MEDIA_DRAG_PAYLOAD_MIME) {
            return JSON.stringify({
              id: 44,
              media: {
                alt: 'Bright exterior',
                filename: 'bright-exterior.jpg',
                height: 900,
                id: 44,
                mimeType: 'image/jpeg',
                updatedAt: '2026-04-07T00:00:00.000Z',
                url: '/media/bright-exterior.jpg',
                width: 1600,
              },
            })
          }

          return type === PAGE_COMPOSER_MEDIA_DRAG_MIME ? '44' : ''
        },
      },
    })

    await waitFor(() => {
      expect(onStageMediaSlot).toHaveBeenCalledTimes(1)
    })

    expect(onStageMediaSlot).toHaveBeenCalledWith(
      expect.objectContaining({
        alt: 'Bright exterior',
        id: 44,
        url: '/media/bright-exterior.jpg',
      }),
      'layout.0.services.0.media',
    )
    expect(global.fetch).not.toHaveBeenCalled()
    expect(screen.getByText('Media staged for this draft. Autosave will persist it.')).toBeTruthy()
  })

  it('opens the focused media workflow with draft-derived section context', () => {
    render(
      <InlinePageMediaEditor relationPath="layout.0.services.0.media">
        <div>Drop zone</div>
      </InlinePageMediaEditor>,
    )

    fireEvent.click(screen.getAllByRole('button', { name: 'Generate' })[0]!)

    expect(onOpenMediaSlot).toHaveBeenCalledWith('layout.0.services.0.media')
    expect(setAuthoringContext).toHaveBeenCalledWith(expect.objectContaining({
      mediaSlot: expect.objectContaining({
        label: 'What we do: House washing',
        relationPath: 'layout.0.services.0.media',
      }),
      page: expect.objectContaining({
        id: 9,
        pagePath: '/',
        slug: 'home',
        status: 'draft',
        title: 'Home',
        visibility: 'public',
      }),
      section: expect.objectContaining({
        index: 0,
        label: 'What we do',
        variant: 'interactive',
      }),
      surface: 'page-composer',
    }))
    expect(openFocusedMediaSession).toHaveBeenCalledWith({
      mode: 'image',
      promptHint: 'What we do: House washing',
    })
  })

  it('prefers draft media state over stale page-media registry entries while composing', () => {
    mediaContextState.currentPage.entries = [
      {
        label: 'Stale registry label',
        media: {
          alt: 'Stale registry alt',
          filename: 'stale.jpg',
          id: 12,
          mimeType: 'image/jpeg',
          previewUrl: '/media/stale.jpg',
          updatedAt: '2026-04-07T00:00:00.000Z',
        },
        mediaId: 12,
        pageId: 7,
        pagePath: '/',
        pageSlug: 'home',
        pageTitle: 'Home',
        relationPath: 'layout.0.services.0.media',
      },
    ]
    toolbarState.draftPage.layout[0]!.services[0]!.media = {
      alt: 'Draft media alt',
      createdAt: '2026-04-07T00:00:00.000Z',
      filename: 'draft.jpg',
      height: 900,
      id: 44,
      mimeType: 'image/jpeg',
      updatedAt: '2026-04-07T00:00:00.000Z',
      url: '/media/draft.jpg',
      width: 1600,
    } as never

    render(
      <InlinePageMediaEditor relationPath="layout.0.services.0.media">
        <div>Drop zone</div>
      </InlinePageMediaEditor>,
    )

    fireEvent.click(screen.getAllByRole('button', { name: 'Generate' })[0]!)

    expect(setAuthoringContext).toHaveBeenCalledWith(expect.objectContaining({
      mediaSlot: expect.objectContaining({
        label: 'What we do: House washing',
        mediaId: 44,
      }),
    }))
    expect(openFocusedMediaSession).toHaveBeenCalledWith({
      mode: 'image',
      promptHint: 'Draft media alt',
    })
  })

  it('opens the composer media tab for replace without launching copilot', () => {
    render(
      <InlinePageMediaEditor relationPath="layout.0.services.0.media">
        <div>Drop zone</div>
      </InlinePageMediaEditor>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Replace' }))

    expect(onOpenMediaSlot).toHaveBeenCalledWith('layout.0.services.0.media')
    expect(setAuthoringContext).not.toHaveBeenCalled()
    expect(openFocusedMediaSession).not.toHaveBeenCalled()
  })

  it('selects the slot in the composer when the canvas media region itself is clicked', () => {
    render(
      <InlinePageMediaEditor relationPath="layout.0.services.0.media">
        <div>Drop zone</div>
      </InlinePageMediaEditor>,
    )

    fireEvent.click(screen.getByText('Drop zone'))

    expect(onOpenMediaSlot).toHaveBeenCalledWith('layout.0.services.0.media')
  })

  it('keeps a full-size wrapper so fill media can inherit slot height', () => {
    render(
      <InlinePageMediaEditor relationPath="layout.0.services.0.media">
        <div>Drop zone</div>
      </InlinePageMediaEditor>,
    )

    const wrapper = screen.getByText('Drop zone').parentElement

    expect(wrapper?.className).toContain('h-full')
    expect(wrapper?.className).toContain('w-full')
    expect(wrapper?.className).toContain('block')
  })

  it('stages dropped media when only text/plain JSON survives the drag payload', async () => {
    render(
      <InlinePageMediaEditor relationPath="layout.0.services.0.media">
        <div>Drop zone</div>
      </InlinePageMediaEditor>,
    )

    fireEvent.drop(screen.getByText('Drop zone').parentElement as HTMLElement, {
      dataTransfer: {
        files: [],
        getData: (type: string) => {
          if (type === PAGE_COMPOSER_MEDIA_DRAG_PAYLOAD_MIME) {
            return ''
          }
          if (type === 'text/plain') {
            return JSON.stringify({
              id: 44,
              media: {
                alt: 'Bright exterior',
                filename: 'bright-exterior.jpg',
                height: 900,
                id: 44,
                mimeType: 'image/jpeg',
                updatedAt: '2026-04-07T00:00:00.000Z',
                url: '/media/bright-exterior.jpg',
                width: 1600,
              },
            })
          }

          return ''
        },
      },
    })

    await waitFor(() => {
      expect(onStageMediaSlot).toHaveBeenCalledTimes(1)
    })

    expect(global.fetch).not.toHaveBeenCalled()
    expect(screen.getByText('Media staged for this draft. Autosave will persist it.')).toBeTruthy()
  })
})
