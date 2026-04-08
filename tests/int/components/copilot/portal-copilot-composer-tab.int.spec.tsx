import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type React from 'react'

import { PortalCopilot } from '@/components/copilot/PortalCopilot'
import { PortalCopilotProvider } from '@/components/copilot/PortalCopilotContext'

const composerState = {
  activeTab: 'structure' as 'content' | 'publish' | 'structure',
  activePagePath: '/',
  close: vi.fn(),
  isOpen: false,
  open: vi.fn(() => {
    composerState.isOpen = true
  }),
  previewMode: 'desktop' as const,
  selectedIndex: 0,
  setActivePagePath: vi.fn(),
  setActiveTab: vi.fn(),
  setOpen: vi.fn(),
  setPreviewMode: vi.fn(),
  setSelectedIndex: vi.fn(),
  toggle: vi.fn(),
}

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}))

vi.mock('@/components/page-composer/PageComposerContext', () => ({
  usePageComposerOptional: () => composerState,
}))

vi.mock('@/components/page-composer/PageComposerDrawer', () => ({
  PageComposerDrawer: () => null,
}))

vi.mock('@/components/admin-impersonation/SiteOperatorToolsPanel', () => ({
  SiteOperatorToolsPanel: () => <div>Mock tools panel</div>,
}))

vi.mock('motion/react', () => {
  const MockMotion = ({
    children,
    className,
    onClick,
    role,
    tabIndex,
  }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={className} onClick={onClick} role={role} tabIndex={tabIndex}>
      {children}
    </div>
  )

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: new Proxy(
      {},
      {
        get: () => MockMotion,
      },
    ),
    useDragControls: () => ({
      start: vi.fn(),
    }),
  }
})

vi.mock('@assistant-ui/react', () => ({
  AssistantRuntimeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ComposerPrimitive: {
    Input: ({
      className,
      placeholder,
    }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
      <textarea className={className} placeholder={placeholder} />
    ),
    Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Send: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  },
  MessagePrimitive: {
    Parts: () => null,
    Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
  ThreadPrimitive: {
    Empty: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Messages: ({ children }: { children: () => React.ReactNode }) => <div>{children()}</div>,
    Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Viewport: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
  useAuiState: (selector: (state: { message: { id: string; index: number; role: string }; thread: { messages: unknown[] } }) => unknown) =>
    selector({
      message: {
        id: 'assistant-1',
        index: 0,
        role: 'assistant',
      },
      thread: {
        messages: [{}],
      },
    }),
  useLocalRuntime: () => ({}),
}))

describe('PortalCopilot composer tab', () => {
  beforeEach(() => {
    composerState.isOpen = false
    composerState.activeTab = 'structure'
    composerState.close.mockReset()
    composerState.open.mockReset()
    composerState.open.mockImplementation(() => {
      composerState.isOpen = true
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('keeps the tools pane free of embedded composer chrome and closes from the top-right control', async () => {
    composerState.isOpen = true
    composerState.activeTab = 'content'

    render(
      <PortalCopilotProvider>
        <PortalCopilot
          operatorTools={{
            effectiveUser: { email: 'admin@grimetime.app', id: 1, name: 'Admin' },
            realUser: { email: 'admin@grimetime.app', id: 1, name: 'Admin' },
          }}
        />
      </PortalCopilotProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: /^Copilot$/i }))
    expect(screen.getByText('Copilot chat')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /composer/i })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /tools/i }))

    await waitFor(() => {
      expect(screen.getByText('Mock tools panel')).toBeTruthy()
    })
    expect(screen.queryByText('Mock embedded composer')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /hide copilot/i }))

    await waitFor(() => {
      expect(screen.queryByText('Mock tools panel')).toBeNull()
    })
  })
})
