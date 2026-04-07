import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CallToActionBlock } from '@/blocks/CallToAction/Component'

const composerState = {
  setActiveTab: vi.fn(),
}

const copilotState = {
  openFocusedTextSession: vi.fn(),
}

const ctaEditor = {
  block: {
    blockType: 'cta' as const,
    links: [],
    richText: null,
  },
  updateCopy: vi.fn(),
  updateLinkLabel: vi.fn(),
}

vi.mock('@/components/admin-impersonation/PageComposerCanvas', () => ({
  usePageComposerCanvasToolbarState: () => ({
    ctaEditor,
    selectedIndex: 3,
  }),
}))

vi.mock('@/components/admin-impersonation/PageComposerContext', () => ({
  usePageComposerOptional: () => composerState,
}))

vi.mock('@/components/copilot/PortalCopilotContext', () => ({
  usePortalCopilotOptional: () => copilotState,
}))

vi.mock('@/components/RichText', () => ({
  default: () => null,
}))

vi.mock('@/components/Link', () => ({
  CMSLink: ({ label }: { label?: string | null }) => <span>{label}</span>,
}))

describe('CallToActionBlock inline editing', () => {
  it('edits CTA copy and labels directly on the page', () => {
    render(
      <CallToActionBlock
        blockType="cta"
        links={[
          {
            link: {
              label: 'Book now',
              type: 'custom',
              url: '/#instant-quote',
            },
          },
        ]}
        richText={{
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Current CTA body.',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        }}
      />,
    )

    fireEvent.change(screen.getByDisplayValue('Current CTA body.'), {
      target: { value: 'Updated CTA body.' },
    })
    expect(ctaEditor.updateCopy).toHaveBeenCalledWith('Updated CTA body.')

    fireEvent.change(screen.getByDisplayValue('Book now'), {
      target: { value: 'Claim your slot' },
    })
    expect(ctaEditor.updateLinkLabel).toHaveBeenCalledWith(0, 'Claim your slot')

    fireEvent.click(screen.getAllByRole('button', { name: /generate text for this field/i })[0]!)
    expect(composerState.setActiveTab).toHaveBeenCalledWith('content')
    expect(copilotState.openFocusedTextSession).toHaveBeenCalled()
  })
})
