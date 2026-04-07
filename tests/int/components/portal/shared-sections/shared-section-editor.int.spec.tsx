import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SharedSectionEditor } from '@/components/portal/shared-sections/SharedSectionEditor'
import type { SharedSectionRecord } from '@/lib/pages/sharedSections'

function buildItem(overrides: Partial<SharedSectionRecord> = {}): SharedSectionRecord {
  return {
    category: 'content',
    createdAt: '2026-04-05T00:00:00.000Z',
    currentVersion: 1,
    description: 'Reusable embed source.',
    id: 9,
    name: 'Homepage embed',
    preview: {
      status: 'pending',
      updatedAt: null,
      url: null,
    },
    publishedAt: null,
    slug: 'homepage-embed',
    status: 'draft',
    structure: {
      children: [
        {
          children: [
            {
              children: [
                {
                  blockType: 'customHtml',
                  id: 'block-1',
                  kind: 'block',
                  props: {
                    html: '<div>Trusted embed</div>',
                    label: 'Embed block',
                  },
                },
              ],
              id: 'column-1',
              kind: 'column',
              props: {},
            },
          ],
          id: 'row-1',
          kind: 'row',
          props: {},
        },
      ],
      id: 'section-1',
      kind: 'section',
      layout: 'customHtml',
      props: {},
    },
    tags: ['embed'],
    updatedAt: '2026-04-05T00:00:00.000Z',
    usageCount: 3,
    ...overrides,
  }
}

function buildVersions() {
  return [
    {
      createdAt: '2026-04-05T00:00:00.000Z',
      id: 'version-1',
      latest: true,
      status: 'draft' as const,
      updatedAt: '2026-04-05T00:00:00.000Z',
      versionNumber: 3,
    },
  ]
}

describe('SharedSectionEditor', () => {
  afterEach(() => {
    cleanup()
  })

  it('saves draft changes through the shared-sections API', async () => {
    const originalFetch = global.fetch
    const nextItem = buildItem({ name: 'Homepage embed v2', slug: 'homepage-embed-v2', tags: ['embed', 'global'] })

    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        item: nextItem,
        permissions: {
          canCreate: true,
          canEditDraft: true,
          canInsertIntoPage: true,
          canPublish: true,
          canRestoreVersion: true,
          canViewLibrary: true,
        },
      }),
      ok: true,
    }) as unknown as typeof fetch

    render(
      <SharedSectionEditor
        initialItem={buildItem()}
        initialVersions={buildVersions()}
        permissions={{
          canCreate: true,
          canEditDraft: true,
          canInsertIntoPage: true,
          canPublish: true,
          canRestoreVersion: true,
          canViewLibrary: true,
        }}
      />,
    )

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Homepage embed v2' } })
    fireEvent.change(screen.getByLabelText('Slug'), { target: { value: 'homepage-embed-v2' } })
    fireEvent.change(screen.getByPlaceholderText('before-after, residential'), { target: { value: 'embed, global' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))

    await waitFor(() => {
      expect(screen.getByText('Saved draft for Homepage embed v2.')).toBeTruthy()
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/internal/shared-sections',
      expect.objectContaining({
        credentials: 'include',
        method: 'POST',
      }),
    )
    const request = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[1]
    expect(JSON.parse(String(request.body))).toMatchObject({
      action: 'save-draft',
      id: 9,
      name: 'Homepage embed v2',
      slug: 'homepage-embed-v2',
      tags: ['embed', 'global'],
    })

    global.fetch = originalFetch
  })

  it('disables publish when the current user lacks publish permission', () => {
    render(
      <SharedSectionEditor
        initialItem={buildItem()}
        initialVersions={buildVersions()}
        permissions={{
          canCreate: true,
          canEditDraft: true,
          canInsertIntoPage: true,
          canPublish: false,
          canRestoreVersion: false,
          canViewLibrary: true,
        }}
      />,
    )

    const publishButtons = screen.getAllByRole('button', { name: 'Publish' })
    expect(publishButtons.some((button) => (button as HTMLButtonElement).disabled)).toBe(true)
  })

  it('restores a selected shared-section version into draft state', async () => {
    const originalFetch = global.fetch
    const originalConfirm = window.confirm
    window.confirm = vi.fn().mockReturnValue(true)

    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        item: buildItem({ currentVersion: 3, name: 'Homepage embed restored' }),
        permissions: {
          canCreate: true,
          canEditDraft: true,
          canInsertIntoPage: true,
          canPublish: true,
          canRestoreVersion: true,
          canViewLibrary: true,
        },
        versions: buildVersions(),
      }),
      ok: true,
    }) as unknown as typeof fetch

    render(
      <SharedSectionEditor
        initialItem={buildItem()}
        initialVersions={buildVersions()}
        permissions={{
          canCreate: true,
          canEditDraft: true,
          canInsertIntoPage: true,
          canPublish: true,
          canRestoreVersion: true,
          canViewLibrary: true,
        }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Restore draft' }))

    await waitFor(() => {
      expect(screen.getByText('Restored version 3 into the current shared-section draft.')).toBeTruthy()
    })

    const request = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[1]
    expect(JSON.parse(String(request.body))).toMatchObject({
      action: 'restore-shared-section-version',
      id: 9,
      versionId: 'version-1',
    })

    window.confirm = originalConfirm
    global.fetch = originalFetch
  })
})
