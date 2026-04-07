import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type React from 'react'

import { PortalCopilotProvider } from '@/components/copilot/PortalCopilotContext'
import { PortalCopilotRuntimeProvider } from '@/components/copilot/PortalCopilotRuntimeProvider'

const assistantUiMocks = vi.hoisted(() => ({
  switchToThread: vi.fn(),
  useLocalRuntime: vi.fn(() => ({})),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

vi.mock('@assistant-ui/react', () => ({
  AssistantCloud: class MockAssistantCloud {
    constructor(public readonly config: object) {}
  },
  AssistantRuntimeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Interactables: () => null,
  useAui: () => ({
    threads: () => ({
      switchToThread: assistantUiMocks.switchToThread,
    }),
  }),
  useAuiState: () => null,
  useLocalRuntime: assistantUiMocks.useLocalRuntime,
}))

describe('PortalCopilotRuntimeProvider', () => {
  beforeEach(() => {
    assistantUiMocks.useLocalRuntime.mockClear()
    assistantUiMocks.switchToThread.mockClear()
    process.env.NEXT_PUBLIC_ASSISTANT_BASE_URL = 'https://proj-0tg4j0qwfdis.assistant-api.com'
  })

  it('passes an assistant-cloud client into the local runtime when configured', () => {
    render(
      <PortalCopilotProvider>
        <PortalCopilotRuntimeProvider>
          <div>runtime child</div>
        </PortalCopilotRuntimeProvider>
      </PortalCopilotProvider>,
    )

    expect(screen.getByText('runtime child')).toBeTruthy()
    expect(assistantUiMocks.useLocalRuntime).toHaveBeenCalled()
    expect(assistantUiMocks.useLocalRuntime.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        cloud: expect.any(Object),
      }),
    )
  })
})
