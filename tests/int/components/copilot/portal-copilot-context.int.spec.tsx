import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PortalCopilotProvider, usePortalCopilot } from '@/components/copilot/PortalCopilotContext'

function Harness({ applyText }: { applyText: (value: string) => void }) {
  const copilot = usePortalCopilot()

  return (
    <div>
      <button
        onClick={() =>
          copilot.openFocusedTextSession({
            applyText,
            currentText: 'Current field copy.',
            fieldLabel: 'hero body',
            fieldPath: 'hero.richText',
          })}
        type="button"
      >
        Open rewrite
      </button>
      <button onClick={() => copilot.applyFocusedText('  Replacement copy.  ')} type="button">
        Apply rewrite
      </button>
      <div>{copilot.canApplyFocusedText ? 'can-apply' : 'cannot-apply'}</div>
    </div>
  )
}

describe('PortalCopilotContext', () => {
  it('stores and applies the current focused text callback', () => {
    const applyText = vi.fn()

    render(
      <PortalCopilotProvider>
        <Harness applyText={applyText} />
      </PortalCopilotProvider>,
    )

    expect(screen.getByText('cannot-apply')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Open rewrite' }))

    expect(screen.getByText('can-apply')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Apply rewrite' }))

    expect(applyText).toHaveBeenCalledWith('Replacement copy.')
  })
})
