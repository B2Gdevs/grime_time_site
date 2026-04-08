import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ServiceGridBlock } from '@/blocks/ServiceGrid/Component'

const composerState = {
  isOpen: true,
  isPanelMinimized: false,
  setActiveTab: vi.fn(),
  setPanelMinimized: vi.fn(),
}

const copilotState = {
  openFocusedTextSession: vi.fn(),
}

const updateBlockField = vi.fn()
const updateHighlightText = vi.fn()
const updateServiceField = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

const mediaResource = {
  alt: 'Freshly cleaned exterior',
  createdAt: '2026-04-06T00:00:00.000Z',
  id: 55,
  updatedAt: '2026-04-06T00:00:00.000Z',
  url: '/media/freshly-cleaned.jpg',
}

const toolbarState = {
  selectedIndex: 0,
  selectedMediaRelationPath: null as null | string,
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

vi.mock('@/components/Media', () => ({
  Media: ({ resource }: { resource?: { alt?: string | null; id?: number } }) => (
    <div data-testid="service-grid-media">{resource?.id}:{resource?.alt}</div>
  ),
}))

vi.mock('@/components/page-composer/PageComposerCanvas', () => ({
  usePageComposerCanvasToolbarState: () => toolbarState,
}))

vi.mock('@/components/page-composer/PageComposerContext', () => ({
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
  beforeEach(() => {
    composerState.setActiveTab.mockReset()
    copilotState.openFocusedTextSession.mockReset()
    updateBlockField.mockReset()
    updateHighlightText.mockReset()
    updateServiceField.mockReset()

    toolbarState.selectedIndex = 0
    toolbarState.selectedMediaRelationPath = null
    toolbarState.serviceGridEditor.block = {
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
    }
  })

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
    expect(copilotState.openFocusedTextSession).toHaveBeenCalled()
  })

  it('renders service-grid media from the live draft block instead of stale props', () => {
    toolbarState.serviceGridEditor.block = {
      blockType: 'serviceGrid' as const,
      displayVariant: 'interactive' as const,
      heading: 'Services',
      intro: 'Draft intro copy.',
      services: [
        {
          eyebrow: 'Soft wash',
          highlights: [{ text: 'Highlight proof point.' }],
          media: mediaResource as never,
          name: 'Draft lane',
          pricingHint: 'Home size and buildup',
          summary: 'Draft summary copy.',
        },
      ],
    }

    render(
      <ServiceGridBlock
        blockIndex={0}
        blockType="serviceGrid"
        displayVariant="interactive"
        heading="Services"
        intro="Prop intro copy."
        services={[
          {
            eyebrow: 'Soft wash',
            highlights: [{ text: 'Highlight proof point.' }],
            media: null,
            name: 'Prop lane',
            pricingHint: 'Home size and buildup',
            summary: 'Prop summary copy.',
          },
        ]}
      />,
    )

    expect(screen.getByDisplayValue('Draft lane')).toBeTruthy()
    expect(screen.getByTestId('service-grid-media').textContent).toContain('55:Freshly cleaned exterior')
  })

  it('syncs the visible lane to the selected media relation path while targeting service media', () => {
    toolbarState.serviceGridEditor.block = {
      blockType: 'serviceGrid' as const,
      displayVariant: 'interactive' as const,
      heading: 'How our pricing works',
      intro: 'Draft intro copy.',
      services: [
        {
          eyebrow: 'Soft wash',
          highlights: [{ text: 'Highlight proof point.' }],
          media: null,
          name: 'House washing',
          pricingHint: 'Home size and buildup',
          summary: 'First lane summary.',
        },
        {
          eyebrow: 'Flatwork',
          highlights: [{ text: 'Driveway proof point.' }],
          media: mediaResource as never,
          name: 'Driveway lane',
          pricingHint: 'Soil and square footage',
          summary: 'Second lane summary.',
        },
      ],
    }
    toolbarState.selectedMediaRelationPath = 'layout.0.services.1.media'

    render(
      <ServiceGridBlock
        blockIndex={0}
        blockType="serviceGrid"
        displayVariant="interactive"
        heading="How our pricing works"
        intro="Prop intro copy."
        services={[
          {
            eyebrow: 'Soft wash',
            highlights: [{ text: 'Highlight proof point.' }],
            media: null,
            name: 'House washing',
            pricingHint: 'Home size and buildup',
            summary: 'First lane summary.',
          },
          {
            eyebrow: 'Flatwork',
            highlights: [{ text: 'Driveway proof point.' }],
            media: null,
            name: 'Driveway lane',
            pricingHint: 'Soil and square footage',
            summary: 'Second lane summary.',
          },
        ]}
      />,
    )

    expect(screen.getByDisplayValue('Driveway lane')).toBeTruthy()
    expect(screen.getByDisplayValue('Second lane summary.')).toBeTruthy()
    expect(screen.getAllByTestId('service-grid-media').some((node) => node.textContent?.includes('55:Freshly cleaned exterior'))).toBe(true)
  })
})
