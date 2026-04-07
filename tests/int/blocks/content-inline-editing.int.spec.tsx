import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ContentBlock } from '@/blocks/Content/Component'

const composerState = {
  setActiveTab: vi.fn(),
}

const copilotState = {
  openFocusedTextSession: vi.fn(),
}

const contentBlockEditor = {
  block: {
    blockType: 'content' as const,
    columns: [],
  },
  updateColumnCopy: vi.fn(),
  updateColumnLinkLabel: vi.fn(),
}

vi.mock('@/components/admin-impersonation/PageComposerCanvas', () => ({
  usePageComposerCanvasToolbarState: () => ({
    contentBlockEditor,
    selectedIndex: 4,
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

describe('ContentBlock inline editing', () => {
  it('edits content columns and link labels directly on the page', () => {
    render(
      <ContentBlock
        blockType="content"
        columns={[
          {
            enableLink: true,
            link: {
              label: 'Learn more',
              type: 'custom',
              url: '/about',
            },
            richText: {
              root: {
                children: [
                  {
                    children: [
                      {
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'Current content column.',
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
            },
            size: 'full',
          },
        ]}
      />,
    )

    fireEvent.change(screen.getByDisplayValue('Current content column.'), {
      target: { value: 'Updated content column.' },
    })
    expect(contentBlockEditor.updateColumnCopy).toHaveBeenCalledWith(0, 'Updated content column.')

    fireEvent.change(screen.getByDisplayValue('Learn more'), {
      target: { value: 'Read the details' },
    })
    expect(contentBlockEditor.updateColumnLinkLabel).toHaveBeenCalledWith(0, 'Read the details')

    fireEvent.click(screen.getAllByRole('button', { name: /generate text for this field/i })[0]!)
    expect(composerState.setActiveTab).toHaveBeenCalledWith('content')
    expect(copilotState.openFocusedTextSession).toHaveBeenCalled()
  })
})
