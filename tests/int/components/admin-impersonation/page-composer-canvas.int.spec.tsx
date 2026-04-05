import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PageComposerCanvasSection, PageComposerCanvasViewport } from '@/components/admin-impersonation/PageComposerCanvas'
import { PageComposerProvider, usePageComposer } from '@/components/admin-impersonation/PageComposerContext'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

function ComposerHarness() {
  const composer = usePageComposer()

  return (
    <>
      <button
        onClick={() => {
          composer.setActivePagePath('/')
          composer.open()
        }}
        type="button"
      >
        Open composer
      </button>
      <div data-testid="selected-index">{composer.selectedIndex}</div>
      <PageComposerCanvasViewport>
        <PageComposerCanvasSection index={0} label="What we do">
          <div>Section one</div>
        </PageComposerCanvasSection>
        <PageComposerCanvasSection index={1} label="How pricing works">
          <div>Section two</div>
        </PageComposerCanvasSection>
      </PageComposerCanvasViewport>
    </>
  )
}

describe('PageComposer canvas integration', () => {
  it('uses the live page surface as the selectable canvas when the composer is open', () => {
    render(
      <PageComposerProvider>
        <ComposerHarness />
      </PageComposerProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open composer' }))

    expect(screen.getByText(/live canvas/i)).toBeTruthy()
    expect(screen.getByText(/click a section on the page to inspect it in the composer/i)).toBeTruthy()

    fireEvent.click(screen.getByText('Section two'))

    expect(screen.getByTestId('selected-index').textContent).toBe('1')
    expect(screen.getByText(/Section 2/i)).toBeTruthy()
    expect(screen.getByText(/How pricing works/i)).toBeTruthy()
  })
})
