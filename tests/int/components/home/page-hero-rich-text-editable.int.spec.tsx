import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PageHeroRichTextEditable } from '@/components/home/PageHeroRichTextEditable'

const composerState = {
  isOpen: true,
  setActiveTab: vi.fn(),
}

const copilotState = {
  openFocusedTextSession: vi.fn(),
}

const heroEditor = {
  copy: 'Generic page hero copy.',
  kind: 'rich-text' as const,
  updateCopy: vi.fn(),
}

vi.mock('@/components/admin-impersonation/PageComposerCanvas', () => ({
  usePageComposerCanvasToolbarState: () => ({
    draftPage: { id: 44, pagePath: '/about' },
    heroEditor,
    selectedIndex: -1,
  }),
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

describe('PageHeroRichTextEditable', () => {
  it('edits generic page hero copy directly on the page and opens a focused rewrite session', () => {
    render(
      <PageHeroRichTextEditable
        body={heroEditor.copy}
        className="min-h-40"
      >
        <p>Fallback hero copy</p>
      </PageHeroRichTextEditable>,
    )

    fireEvent.change(screen.getByDisplayValue(heroEditor.copy), {
      target: { value: 'Updated generic hero copy.' },
    })

    expect(heroEditor.updateCopy).toHaveBeenCalledWith('Updated generic hero copy.')

    fireEvent.click(screen.getByRole('button', { name: /generate text for this field/i }))

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
