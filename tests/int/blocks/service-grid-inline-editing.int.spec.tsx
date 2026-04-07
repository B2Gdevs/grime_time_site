import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ServiceGridBlock } from '@/blocks/ServiceGrid/Component'

const composerState = {
  isOpen: true,
  setActiveTab: vi.fn(),
}

const copilotState = {
  openFocusedTextSession: vi.fn(),
}

const updateBlockField = vi.fn()
const updateHighlightText = vi.fn()
const updateServiceField = vi.fn()

const toolbarState = {
  selectedIndex: 0,
  sectionSummaries: [
    {
      badges: [],
      blockType: 'serviceGrid',
      category: 'reusable',
      description: 'featureCards - 1 row',
      hidden: false,
      index: 0,
      label: 'What we do',
      variant: 'featureCards',
    },
  ],
  serviceGridEditor: {
    block: {
      blockType: 'serviceGrid' as const,
      displayVariant: 'featureCards' as const,
      heading: 'What we do',
      intro: 'Visible intro copy.',
      services: [
        {
          eyebrow: 'Soft wash',
          highlights: [{ text: 'Highlight proof point.' }],
          name: 'House washing',
          pricingHint: 'Home size and buildup',
          summary: 'Visible summary copy.',
        },
      ],
    },
    updateBlockField,
    updateHighlightText,
    updateServiceField,
  },
}

vi.mock('@/components/admin-impersonation/PageComposerCanvas', () => ({
  usePageComposerCanvasToolbarState: () => toolbarState,
}))

vi.mock('@/components/admin-impersonation/PageComposerContext', () => ({
  usePageComposerOptional: () => composerState,
}))

vi.mock('@/components/copilot/PortalCopilotContext', () => ({
  usePortalCopilotOptional: () => copilotState,
}))

vi.mock('@/components/copilot/CopilotInteractable', () => ({
  useHeroInteractable: () => undefined,
  useLiveCanvasInteractable: () => undefined,
  useSectionInteractable: () => undefined,
}))

describe('ServiceGridBlock inline editing', () => {
  it('renders direct on-page editors for the selected service grid block', () => {
    render(
      <ServiceGridBlock
        blockIndex={0}
        blockType="serviceGrid"
        displayVariant="featureCards"
        heading="What we do"
        intro="Visible intro copy."
        services={[
          {
            eyebrow: 'Soft wash',
            highlights: [{ text: 'Highlight proof point.' }],
            name: 'House washing',
            pricingHint: 'Home size and buildup',
            summary: 'Visible summary copy.',
          },
        ]}
      />,
    )

    fireEvent.change(screen.getByDisplayValue('What we do'), {
      target: { value: 'Updated heading' },
    })
    expect(updateBlockField).toHaveBeenCalledWith('heading', 'Updated heading')

    fireEvent.change(screen.getByDisplayValue('House washing'), {
      target: { value: 'Updated service title' },
    })
    expect(updateServiceField).toHaveBeenCalledWith('name', 0, 'Updated service title')

    fireEvent.change(screen.getByDisplayValue('Visible summary copy.'), {
      target: { value: 'Updated service summary' },
    })
    expect(updateServiceField).toHaveBeenCalledWith('summary', 0, 'Updated service summary')

    fireEvent.change(screen.getByDisplayValue('Highlight proof point.'), {
      target: { value: 'Updated highlight' },
    })
    expect(updateHighlightText).toHaveBeenCalledWith(0, 0, 'Updated highlight')

    fireEvent.click(screen.getAllByRole('button', { name: /generate text for this field/i })[0]!)
    expect(composerState.setActiveTab).toHaveBeenCalledWith('content')
    expect(copilotState.openFocusedTextSession).toHaveBeenCalled()
  })
})
