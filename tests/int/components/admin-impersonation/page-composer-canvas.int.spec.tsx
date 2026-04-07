import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PageComposerCanvasSection, PageComposerCanvasViewport } from '@/components/admin-impersonation/PageComposerCanvas'
import { PAGE_COMPOSER_TOOLBAR_EVENT, PageComposerProvider, usePageComposer } from '@/components/admin-impersonation/PageComposerContext'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

vi.mock('@/components/copilot/CopilotInteractable', () => ({
  useHeroInteractable: () => undefined,
  useLiveCanvasInteractable: () => undefined,
  useSectionInteractable: () => undefined,
}))

const onCreateDraft = vi.fn()

function ComposerHarness() {
  const composer = usePageComposer()

  return (
    <>
      <button
        onClick={() => {
          composer.setActivePagePath('/')
          window.dispatchEvent(new CustomEvent(PAGE_COMPOSER_TOOLBAR_EVENT, { detail: {
            availablePages: [
              {
                _status: 'draft',
                id: 7,
                pagePath: '/',
                publishedAt: null,
                slug: 'home',
                title: 'Home',
                updatedAt: '2026-04-06T00:00:00.000Z',
                visibility: 'public',
              },
            ],
            creatingDraftClone: false,
            dirty: false,
            draftPage: {
              _status: 'draft',
              hero: { type: 'lowImpact' },
              id: 7,
              layout: [],
              pagePath: '/',
              publishedAt: null,
              slug: 'home',
              title: 'Home',
              updatedAt: '2026-04-06T00:00:00.000Z',
              visibility: 'public',
            },
            loading: false,
            onAddAbove: vi.fn(),
            onAddBelow: vi.fn(),
            onCreateDraft,
            onDeleteBlock: vi.fn(),
            onDuplicateBlock: vi.fn(),
            onSetSlugDraft: vi.fn(),
            onSetTitleDraft: vi.fn(),
            onSetVisibilityDraft: vi.fn(),
            onToggleHidden: vi.fn(),
            sectionSummaries: [
              {
                badges: [],
                blockType: 'content',
                description: 'Hero section',
                hidden: false,
                index: 0,
                label: 'What we do',
                variant: null,
              },
              {
                badges: ['reusable'],
                blockType: 'pricing',
                description: 'Pricing explainer',
                hidden: false,
                index: 1,
                label: 'How pricing works',
                variant: 'stacked',
              },
            ],
            selectedIndex: composer.selectedIndex,
            slugDraft: 'home',
            switchToPage: vi.fn(),
            titleDraft: 'Home',
            visibilityDraft: 'public',
          }}))
          composer.open()
        }}
        type="button"
      >
        Open composer
      </button>
      <div data-testid="selected-index">{composer.selectedIndex}</div>
      <PageComposerCanvasViewport>
        <PageComposerCanvasSection index={0} label="What we do">
          <div>Section one</div>
        </PageComposerCanvasSection>
        <PageComposerCanvasSection index={1} label="How pricing works">
          <div>Section two</div>
        </PageComposerCanvasSection>
      </PageComposerCanvasViewport>
    </>
  )
}

describe('PageComposer canvas integration', () => {
  it('uses the live page surface as the selectable canvas when the composer is open', () => {
    onCreateDraft.mockReset()

    render(
      <PageComposerProvider>
        <ComposerHarness />
      </PageComposerProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open composer' }))

    expect(screen.getByText('Visual composer')).toBeTruthy()
    expect(screen.getByDisplayValue('Home')).toBeTruthy()
    expect(screen.getByDisplayValue('home')).toBeTruthy()
    expect(screen.getByRole('combobox')).toBeTruthy()
    expect(screen.getByRole('button', { name: /create draft/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^draft$/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^public$/i })).toBeTruthy()
    expect(screen.getByRole('link', { name: /open route preview/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /desktop preview/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /close composer/i })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /create draft/i }))
    expect(onCreateDraft).toHaveBeenCalled()

    fireEvent.click(screen.getByText('Section two'))

    expect(screen.getByTestId('selected-index').textContent).toBe('1')
    expect(screen.getByText(/Section 2/i)).toBeTruthy()
    expect(screen.getAllByText(/How pricing works/i).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: /close composer/i }))

    expect(screen.queryByDisplayValue('Home')).toBeNull()
  })
})
