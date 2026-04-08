import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PageComposerCanvasSection, PageComposerCanvasViewport } from '@/components/page-composer/PageComposerCanvas'
import { PAGE_COMPOSER_TOOLBAR_EVENT, PageComposerProvider, usePageComposer } from '@/components/page-composer/PageComposerContext'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

vi.mock('@/components/copilot/CopilotInteractable', () => ({
  useHeroInteractable: () => undefined,
  useLiveCanvasInteractable: () => undefined,
  useSectionInteractable: () => undefined,
}))

function ComposerHarness() {
  const composer = usePageComposer()

  return (
    <>
      <button
        onClick={() => {
          composer.setActivePagePath('/')
          window.dispatchEvent(new CustomEvent(PAGE_COMPOSER_TOOLBAR_EVENT, {
            detail: {
              canDeleteDraftPage: false,
              canResetDraft: false,
              contentBlockEditor: null,
              ctaEditor: null,
              deleteDraftPageBusy: false,
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
              draftToolbarBusy: false,
              draftToolbarStatusLabel: null,
              heroEditor: null,
              loading: false,
              onAddAbove: vi.fn(),
              onAddBelow: vi.fn(),
              onDeleteBlock: vi.fn(),
              onDeleteDraftPage: vi.fn(),
              onDuplicateBlock: vi.fn(),
              onStageMediaSlot: vi.fn(),
              onOpenMediaSlot: vi.fn(),
              onResetDraft: vi.fn(),
              onSetSlugDraft: vi.fn(),
              onSetTitleDraft: vi.fn(),
              onSetVisibilityDraft: vi.fn(),
              onToggleHidden: vi.fn(),
              pricingTableEditor: null,
              sectionSummaries: [
                {
                  badges: [],
                  blockType: 'content',
                  category: 'static',
                  description: 'Hero section',
                  hidden: false,
                  index: 0,
                  label: 'What we do',
                  variant: null,
                },
                {
                  badges: ['reusable'],
                  blockType: 'pricing',
                  category: 'static',
                  description: 'Pricing explainer',
                  hidden: false,
                  index: 1,
                  label: 'How pricing works',
                  variant: 'stacked',
                },
              ],
              selectedIndex: composer.selectedIndex,
              serviceGridEditor: null,
              slugDraft: 'home',
              testimonialsEditor: null,
              titleDraft: 'Home',
              visibilityDraft: 'public',
            },
          }))
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
    render(
      <PageComposerProvider>
        <ComposerHarness />
      </PageComposerProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open composer' }))

    expect(screen.getByText('Composer canvas bar')).toBeTruthy()
    expect(screen.getByDisplayValue('Home')).toBeTruthy()
    expect(screen.getByDisplayValue('home')).toBeTruthy()
    expect(screen.getByText(/^draft$/i)).toBeTruthy()
    expect(screen.getByText(/^public$/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /preview size/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /close composer/i })).toBeTruthy()

    fireEvent.click(screen.getByText('Section two'))

    expect(screen.getByTestId('selected-index').textContent).toBe('1')
    expect(screen.getByText('Section two')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /close composer/i }))

    expect(screen.queryByDisplayValue('Home')).toBeNull()
  })
})
