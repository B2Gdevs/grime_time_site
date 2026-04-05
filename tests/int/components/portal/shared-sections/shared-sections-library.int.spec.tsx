import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SharedSectionsLibrary } from '@/components/portal/shared-sections/SharedSectionsLibrary'
import type { SharedSectionRecord } from '@/lib/pages/sharedSections'

function buildItem(overrides: Partial<SharedSectionRecord>): SharedSectionRecord {
  return {
    category: 'hero',
    createdAt: '2026-04-04T00:00:00.000Z',
    currentVersion: 1,
    description: 'Primary hero source.',
    id: 1,
    name: 'Homepage hero',
    preview: {
      status: 'pending',
      updatedAt: null,
      url: null,
    },
    publishedAt: null,
    slug: 'homepage-hero',
    status: 'draft',
    structure: {
      children: [
        {
          children: [
            {
              children: [],
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
      layout: 'content',
      props: {},
    },
    tags: ['residential'],
    updatedAt: '2026-04-04T00:00:00.000Z',
    usageCount: 0,
    ...overrides,
  }
}

function renderLibrary(args: { items: SharedSectionRecord[] }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <SharedSectionsLibrary
        initialData={{
          items: args.items,
          permissions: {
            canCreate: true,
            canEditDraft: true,
            canInsertIntoPage: true,
            canPublish: true,
            canRestoreVersion: true,
            canViewLibrary: true,
          },
        }}
      />
    </QueryClientProvider>,
  )
}

describe('SharedSectionsLibrary', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  it('renders the shared section metrics and cards from the initial library payload', () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        items: [buildItem({ id: 1 }), buildItem({ id: 2, name: 'Driveway CTA', category: 'cta', slug: 'driveway-cta' })],
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

    renderLibrary({
      items: [buildItem({ id: 1 }), buildItem({ id: 2, name: 'Driveway CTA', category: 'cta', slug: 'driveway-cta' })],
    })

    expect(screen.getByRole('heading', { name: 'Create shared section' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Shared section library' })).toBeTruthy()
    expect(screen.getAllByText('Homepage hero').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Driveway CTA').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('link', { name: 'Edit source' })[0]?.getAttribute('href')).toBe('/shared-sections/1/edit')
    const librarySizeCard = screen.getByText('Library size').closest('[class*="rounded-lg"]')
    expect(librarySizeCard).toBeTruthy()
    expect(within(librarySizeCard as HTMLElement).getByText('2')).toBeTruthy()
  })

  it('creates a shared section and refreshes the library cards', async () => {
    const items = [buildItem({ id: 1 })]

    global.fetch = vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method || 'GET'

      if (url.startsWith('/api/internal/shared-sections') && method === 'GET') {
        return {
          json: async () => ({
            items,
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
        } as Response
      }

      if (url === '/api/internal/shared-sections' && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}'))
        const created = buildItem({
          category: body.category,
          description: body.description,
          id: 2,
          name: body.name,
          slug: 'trust-band',
          tags: body.tags,
        })
        items.unshift(created)

        return {
          json: async () => ({
            item: created,
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
        } as Response
      }

      throw new Error(`Unexpected request: ${method} ${url}`)
    }) as typeof fetch

    renderLibrary({ items })

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Trust band' },
    })
    fireEvent.change(screen.getByPlaceholderText('before-after, residential'), {
      target: { value: 'trust, proof' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create shared section' }))

    await waitFor(() => {
      expect(screen.getByText('Created Trust band.')).toBeTruthy()
    })

    await waitFor(() => {
      expect(screen.getAllByText('Trust band').length).toBeGreaterThanOrEqual(1)
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/internal/shared-sections',
      expect.objectContaining({
        method: 'POST',
      }),
    )
  })
})
