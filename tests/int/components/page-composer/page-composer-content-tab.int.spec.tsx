import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PageComposerDrawerContentTab } from '@/components/page-composer/drawer/PageComposerDrawerContentTab'
import { createLexicalParagraph } from '@/lib/pages/pageComposerLexical'
import type { PageComposerSectionSummary } from '@/lib/pages/pageComposer'
import type { HeroBlock, ServiceEstimatorBlock } from '@/payload-types'

function createBaseProps() {
  const selectedSummary: PageComposerSectionSummary = {
    badges: [],
    blockType: 'heroBlock',
    category: 'static',
    description: 'Homepage hero',
    hidden: false,
    index: 0,
    label: 'Hero',
    variant: 'lowImpact',
  }

  return {
    detachReusableBlock: vi.fn(),
    draftPage: {
      _status: 'draft' as const,
      hero: { type: 'none' as const },
      id: 7,
      layout: [],
      pagePath: '/',
      publishedAt: null,
      slug: 'home',
      title: 'Home',
      updatedAt: null,
      visibility: 'public' as const,
    },
    heroCopy: 'North Texas exterior cleaning with a clearer quote path and visible proof.',
    loading: false,
    mutateSelectedService: vi.fn(),
    mutateSelectedServiceGrid: vi.fn(),
    onOpenMediaSlot: vi.fn(),
    openBlockLibrary: vi.fn(),
    removeBlock: vi.fn(),
    selectedIndex: 0,
    selectedSummary,
    status: null,
    updateHeroCopy: vi.fn(),
    updateHeroField: vi.fn(),
  }
}

describe('PageComposerDrawerContentTab', () => {
  afterEach(() => {
    cleanup()
  })

  it('keeps replace affordances visible while exposing hero block fields', () => {
    const props = createBaseProps()
    const heroBlock: HeroBlock = {
      blockType: 'heroBlock',
      eyebrow: 'Grime Time exterior cleaning',
      headlineAccent: 'Visible results.',
      headlinePrimary: 'Clear scope.',
      panelBody: 'Strong visuals, clear service lanes, and a quote form that explains what moves the number.',
      panelEyebrow: 'Fast lane for homeowners',
      panelHeading: 'Quotes and scheduling without vague contractor talk.',
      richText: createLexicalParagraph(props.heroCopy),
      type: 'lowImpact',
    }

    render(
      <PageComposerDrawerContentTab
        {...props}
        resolvedSelectedBlock={heroBlock}
        selectedBlock={heroBlock}
        selectedHeroBlock={heroBlock}
      />,
    )

    expect(screen.getAllByRole('button', { name: 'Find blocks' })).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Add below' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Remove block' })).toBeTruthy()
    expect(screen.getByDisplayValue('Clear scope.')).toBeTruthy()
    expect(screen.getByDisplayValue('Quotes and scheduling without vague contractor talk.')).toBeTruthy()

    fireEvent.change(screen.getByDisplayValue('Clear scope.'), {
      target: { value: 'Sharper headline' },
    })

    expect(props.updateHeroField).toHaveBeenCalledWith('headlinePrimary', 'Sharper headline')

    fireEvent.change(screen.getByDisplayValue(props.heroCopy), {
      target: { value: 'Updated hero body copy.' },
    })

    expect(props.updateHeroCopy).toHaveBeenCalledWith('Updated hero body copy.')

    fireEvent.click(screen.getByRole('button', { name: 'Add below' }))
    expect(props.openBlockLibrary).toHaveBeenCalledWith(1, 'insert')

    fireEvent.click(screen.getByRole('button', { name: 'Remove block' }))
    expect(props.removeBlock).toHaveBeenCalledWith(0)
  })

  it('uses app-block copy instead of pretending app blocks have generic field editing', () => {
    const props = createBaseProps()
    const appBlock: ServiceEstimatorBlock = {
      blockType: 'serviceEstimator',
    }

    render(
      <PageComposerDrawerContentTab
        {...props}
        resolvedSelectedBlock={appBlock}
        selectedBlock={appBlock}
        selectedHeroBlock={null}
        selectedSummary={{
          ...props.selectedSummary,
          blockType: 'serviceEstimator',
          category: 'dynamic',
          description: 'Quote estimator',
          label: 'Service estimator',
          variant: null,
        }}
      />,
    )

    expect(screen.getByText(/code-owned app functionality/i)).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Find blocks' })).toHaveLength(1)
    expect(screen.queryByDisplayValue(props.heroCopy)).toBeNull()
  })
})
