import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useSensors } from '@dnd-kit/core'

import { PageComposerDrawerStructureTab } from '@/components/page-composer/drawer/PageComposerDrawerStructureTab'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { PageComposerSectionSummary } from '@/lib/pages/pageComposer'

function createSummaries(): PageComposerSectionSummary[] {
  return [
    {
      badges: [],
      blockType: 'heroBlock',
      category: 'static',
      description: 'lowImpact hero with media',
      hidden: false,
      identity: 'id:hero',
      index: 0,
      label: 'Hero',
      variant: 'lowImpact',
    },
    {
      badges: ['reusable'],
      blockType: 'serviceGrid',
      category: 'static',
      description: 'interactive - 3 rows',
      hidden: false,
      identity: 'id:services',
      index: 1,
      label: 'What we do',
      variant: 'interactive',
    },
  ]
}

function LayoutTabHarness({
  openBlockLibrary = vi.fn(),
  setSelectedIndex = vi.fn(),
}: {
  openBlockLibrary?: (index: number, mode?: 'insert' | 'replace') => void
  setSelectedIndex?: (index: number) => void
}) {
  const sensors = useSensors()
  const sectionSummaries = createSummaries()

  return (
    <TooltipProvider>
      <PageComposerDrawerStructureTab
        draftPage={{
          _status: 'draft',
          hero: { type: 'lowImpact' },
          id: 7,
          layout: [],
          pagePath: '/',
          publishedAt: null,
          slug: 'home',
          title: 'Home',
          updatedAt: '2026-04-08T00:00:00.000Z',
          visibility: 'public',
        }}
        duplicateBlock={vi.fn()}
        handleDragEnd={vi.fn()}
        heroSummary={sectionSummaries[0]}
        layoutSectionSummaries={sectionSummaries}
        loading={false}
        openBlockLibrary={openBlockLibrary}
        removeBlock={vi.fn()}
        sectionSummaries={sectionSummaries}
        selectedIndex={0}
        sensors={sensors}
        setSelectedIndex={setSelectedIndex}
        status={null}
        toggleBlockHidden={vi.fn()}
      />
    </TooltipProvider>
  )
}

describe('PageComposerDrawerStructureTab', () => {
  afterEach(() => {
    cleanup()
  })

  it('surfaces layout controls with concise block rows', () => {
    render(<LayoutTabHarness />)

    expect(screen.getByText('Layout')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Add to bottom' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Block help for Hero' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Replace block What we do' })).toBeTruthy()
    expect(screen.getByText(/drag blocks to reorder the page/i)).toBeTruthy()
  })

  it('opens replace mode for the selected row', () => {
    const openBlockLibrary = vi.fn()
    const setSelectedIndex = vi.fn()

    render(<LayoutTabHarness openBlockLibrary={openBlockLibrary} setSelectedIndex={setSelectedIndex} />)

    fireEvent.click(screen.getByRole('button', { name: 'Replace block What we do' }))

    expect(setSelectedIndex).toHaveBeenCalledWith(1)
    expect(openBlockLibrary).toHaveBeenCalledWith(1, 'replace')
  })

  it('adds new blocks from the bottom of the layout list', () => {
    const openBlockLibrary = vi.fn()

    render(<LayoutTabHarness openBlockLibrary={openBlockLibrary} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add to bottom' }))

    expect(openBlockLibrary).toHaveBeenCalledWith(2)
  })
})
