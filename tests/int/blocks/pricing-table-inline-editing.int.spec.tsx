import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PricingTableBlock } from '@/blocks/PricingTable/Component'

const composerState = {
  setActiveTab: vi.fn(),
}

const copilotState = {
  openFocusedTextSession: vi.fn(),
}

const pricingEditor = {
  block: {
    blockType: 'pricingTable' as const,
    dataSource: 'inline' as const,
    heading: 'Packages & pricing',
    inlinePlans: [],
  },
  updateBlockField: vi.fn(),
  updateFeatureText: vi.fn(),
  updatePlanField: vi.fn(),
  updatePlanLinkLabel: vi.fn(),
}

vi.mock('@/components/page-composer/PageComposerCanvas', () => ({
  usePageComposerCanvasToolbarState: () => ({
    pricingTableEditor: pricingEditor,
    selectedIndex: 2,
  }),
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

describe('PricingTableBlock inline editing', () => {
  it('edits inline pricing content directly on the page and opens focused text generation', () => {
    render(
      <PricingTableBlock
        blockType="pricingTable"
        dataSource="inline"
        globalPricing={null}
        heading="Packages & pricing"
        inlinePlans={[
          {
            features: [{ text: 'Feature one' }],
            link: { label: 'Get started', type: 'custom', url: '/#instant-quote' },
            name: 'Starter wash',
            price: '$149',
            priceNote: 'Typical one-story home',
            tagline: 'Fast curb appeal reset',
          },
        ]}
      />,
    )

    fireEvent.change(screen.getByDisplayValue('Packages & pricing'), {
      target: { value: 'Updated pricing heading' },
    })
    expect(pricingEditor.updateBlockField).toHaveBeenCalledWith('heading', 'Updated pricing heading')

    fireEvent.change(screen.getByDisplayValue('Starter wash'), {
      target: { value: 'Updated plan name' },
    })
    expect(pricingEditor.updatePlanField).toHaveBeenCalledWith('name', 0, 'Updated plan name')

    fireEvent.change(screen.getByDisplayValue('Feature one'), {
      target: { value: 'Updated feature line' },
    })
    expect(pricingEditor.updateFeatureText).toHaveBeenCalledWith(0, 0, 'Updated feature line')

    fireEvent.click(screen.getAllByRole('button', { name: /generate text for this field/i })[0]!)

    expect(composerState.setActiveTab).toHaveBeenCalledWith('content')
    expect(copilotState.openFocusedTextSession).toHaveBeenCalled()
  })
})
