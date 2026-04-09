import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PageComposerDrawerMediaLibraryCard } from '@/components/page-composer/drawer/PageComposerDrawerMediaLibraryCard'
import {
  PAGE_COMPOSER_MEDIA_DRAG_MIME,
  PAGE_COMPOSER_MEDIA_DRAG_PAYLOAD_MIME,
} from '@/lib/pages/pageComposerMediaDrag'

describe('PageComposerDrawerMediaLibraryCard', () => {
  it('stays draggable for canvas assignment even when slot actions are locked by a dirty draft', () => {
    const setData = vi.fn()
    const onUseThisMedia = vi.fn()

    render(
      <PageComposerDrawerMediaLibraryCard
        busy={false}
        dragDisabled={false}
        item={{
          alt: 'Driveway proof',
          filename: 'driveway-proof.jpg',
          id: 44,
          media: {
            alt: 'Driveway proof',
            createdAt: '2026-04-07T00:00:00.000Z',
            filename: 'driveway-proof.jpg',
            height: 900,
            id: 44,
            mimeType: 'image/jpeg',
            updatedAt: '2026-04-07T00:00:00.000Z',
            url: '/media/driveway-proof.jpg',
            width: 1600,
          } as never,
          mimeType: 'image/jpeg',
          previewUrl: '/media/driveway-proof.jpg',
          updatedAt: '2026-04-07T00:00:00.000Z',
        }}
        mediaActionsLocked
        onDelete={() => undefined}
        onGenerate={() => undefined}
        onReplaceFilePick={() => undefined}
        onUseThisMedia={onUseThisMedia}
        selectedMediaSlot={{
          label: 'Driveway lane',
          media: null,
          mediaId: null,
          mimeType: null,
          relationPath: 'layout.0.services.0.media',
        }}
      />,
    )

    const card = screen.getByRole('listitem')
    expect(card.getAttribute('draggable')).toBe('true')

    fireEvent.dragStart(card, {
      dataTransfer: {
        effectAllowed: 'uninitialized',
        setData,
      },
    })

    expect(setData).toHaveBeenCalledWith(PAGE_COMPOSER_MEDIA_DRAG_MIME, '44')
    expect(setData).toHaveBeenCalledWith(
      PAGE_COMPOSER_MEDIA_DRAG_PAYLOAD_MIME,
      expect.stringContaining('"id":44'),
    )
    expect(setData).toHaveBeenCalledWith(
      'text/plain',
      expect.stringContaining('"id":44'),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Use media 44 for Driveway lane' }))

    expect(onUseThisMedia).toHaveBeenCalledTimes(1)
  })

  it('starts the custom drag payload from the preview image itself', () => {
    const setData = vi.fn()

    render(
      <PageComposerDrawerMediaLibraryCard
        busy={false}
        dragDisabled={false}
        item={{
          alt: 'Driveway proof',
          filename: 'driveway-proof.jpg',
          id: 44,
          media: {
            alt: 'Driveway proof',
            createdAt: '2026-04-07T00:00:00.000Z',
            filename: 'driveway-proof.jpg',
            height: 900,
            id: 44,
            mimeType: 'image/jpeg',
            updatedAt: '2026-04-07T00:00:00.000Z',
            url: '/media/driveway-proof.jpg',
            width: 1600,
          } as never,
          mimeType: 'image/jpeg',
          previewUrl: '/media/driveway-proof.jpg',
          updatedAt: '2026-04-07T00:00:00.000Z',
        }}
        mediaActionsLocked={false}
        onDelete={() => undefined}
        onGenerate={() => undefined}
        onReplaceFilePick={() => undefined}
        selectedMediaSlot={null}
      />,
    )

    fireEvent.dragStart(screen.getAllByAltText('Driveway proof')[0]!, {
      dataTransfer: {
        effectAllowed: 'uninitialized',
        setData,
      },
    })

    expect(setData).toHaveBeenCalledWith(PAGE_COMPOSER_MEDIA_DRAG_MIME, '44')
    expect(setData).toHaveBeenCalledWith(
      PAGE_COMPOSER_MEDIA_DRAG_PAYLOAD_MIME,
      expect.stringContaining('"id":44'),
    )
    expect(setData).toHaveBeenCalledWith(
      'text/plain',
      expect.stringContaining('"id":44'),
    )
  })
})
