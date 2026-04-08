/* eslint-disable @next/next/no-img-element */

import { fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { TestimonialsBlockClient } from '@/blocks/Testimonials/TestimonialsBlockClient'

const composerState = {
  setActiveTab: vi.fn(),
}

const copilotState = {
  openFocusedTextSession: vi.fn(),
}

const testimonialsEditor = {
  block: {
    blockType: 'testimonialsBlock' as const,
    heading: 'What customers say',
    intro: null,
  },
  updateHeading: vi.fn(),
  updateIntro: vi.fn(),
}

vi.mock('@/components/page-composer/PageComposerCanvas', () => ({
  usePageComposerCanvasToolbarState: () => ({
    selectedIndex: 5,
    testimonialsEditor,
  }),
}))

vi.mock('@/components/page-composer/PageComposerContext', () => ({
  usePageComposerOptional: () => composerState,
}))

vi.mock('@/components/copilot/PortalCopilotContext', () => ({
  usePortalCopilotOptional: () => copilotState,
}))

vi.mock('@/components/RichText', () => ({
  default: () => null,
}))

vi.mock('next/image', () => ({
  default: (props: ComponentProps<'img'>) => <img {...props} alt={props.alt || ''} />,
}))

describe('TestimonialsBlock inline editing', () => {
  it('edits testimonials heading and intro directly on the page', () => {
    render(
      <TestimonialsBlockClient
        heading="What customers say"
        intro={{
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Real feedback from recurring customers.',
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
        items={[
          {
            authorDetail: 'Quarterly service',
            authorName: 'Alex Parker',
            id: 1,
            photo: null,
            published: true,
            quote: 'They showed up on time and the driveway looked brand new.',
            rating: 5,
          } as never,
        ]}
      />,
    )

    fireEvent.change(screen.getByDisplayValue('What customers say'), {
      target: { value: 'Proof from the route' },
    })
    expect(testimonialsEditor.updateHeading).toHaveBeenCalledWith('Proof from the route')

    fireEvent.change(screen.getByDisplayValue('Real feedback from recurring customers.'), {
      target: { value: 'Feedback from homeowners who keep us on the schedule.' },
    })
    expect(testimonialsEditor.updateIntro).toHaveBeenCalledWith('Feedback from homeowners who keep us on the schedule.')

    fireEvent.click(screen.getAllByRole('button', { name: /generate text for this field/i })[0]!)
    expect(composerState.setActiveTab).toHaveBeenCalledWith('content')
    expect(copilotState.openFocusedTextSession).toHaveBeenCalled()
  })
})
