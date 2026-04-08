import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MarketingHeroLead, MarketingHeroPanel } from '@/components/home/MarketingHeroEditable'

const composerState = {
  setActiveTab: vi.fn(),
}

const copilotState = {
  openFocusedTextSession: vi.fn(),
}

const heroEditor = {
  copy: 'North Texas exterior cleaning with a clearer quote path and visible proof.',
  kind: 'marketing-home' as const,
  eyebrow: 'Grime Time exterior cleaning',
  headlineAccent: 'Visible results.',
  headlinePrimary: 'Clear scope.',
  panelBody: 'Strong visuals, clear service lanes, and a quote form that explains what moves the number.',
  panelEyebrow: 'Fast lane for homeowners',
  panelHeading: 'Quotes and scheduling without vague contractor talk.',
  updateField: vi.fn(),
  updateCopy: vi.fn(),
}

vi.mock('@/components/page-composer/PageComposerCanvas', () => ({
  usePageComposerCanvasToolbarState: () => ({
    heroEditor,
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

describe('MarketingHeroEditable', () => {
  it('edits homepage hero text directly on the page and opens focused text sessions', () => {
    render(
      <>
        <MarketingHeroLead
          body={heroEditor.copy}
          eyebrow={heroEditor.eyebrow}
          headlineAccent={heroEditor.headlineAccent}
          headlinePrimary={heroEditor.headlinePrimary}
        />
        <MarketingHeroPanel
          panelBody={heroEditor.panelBody}
          panelEyebrow={heroEditor.panelEyebrow}
          panelHeading={heroEditor.panelHeading}
        />
      </>,
    )

    fireEvent.change(screen.getByDisplayValue(heroEditor.headlinePrimary), {
      target: { value: 'Sharper headline' },
    })

    expect(heroEditor.updateField).toHaveBeenCalledWith('headlinePrimary', 'Sharper headline')

    fireEvent.change(screen.getByDisplayValue(heroEditor.copy), {
      target: { value: 'Updated hero body copy.' },
    })

    expect(heroEditor.updateCopy).toHaveBeenCalledWith('Updated hero body copy.')

    const bodyField = screen.getByDisplayValue(heroEditor.copy)
    const bodyButton = bodyField.parentElement?.querySelector('button')

    expect(bodyButton).toBeTruthy()
    fireEvent.click(bodyButton as HTMLButtonElement)

    expect(composerState.setActiveTab).toHaveBeenCalledWith('content')
    expect(copilotState.openFocusedTextSession).toHaveBeenCalledWith(
      expect.objectContaining({
        applyText: expect.any(Function),
        currentText: heroEditor.copy,
        fieldLabel: 'hero body',
        fieldPath: 'hero.richText',
      }),
    )
  })
})
