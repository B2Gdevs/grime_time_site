import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { OPS_DASHBOARD_PATH, OPS_WORKSPACE_PATH } from '@/lib/navigation/portalPaths'

const push = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => OPS_DASHBOARD_PATH),
  useRouter: vi.fn(() => ({
    push,
  })),
}))

describe('Portal copilot panels', () => {
  beforeEach(() => {
    push.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('builds workspace tour links with the required tab context', async () => {
    const { buildCopilotTourHref } = await import('@/components/copilot/PortalCopilotPanels')

    expect(
      buildCopilotTourHref({
        blurb: 'Queues, search, and field leads',
        id: 'staff-crm-workspace',
        label: 'Ops workspace',
        opsTab: 'crm',
        path: OPS_WORKSPACE_PATH,
      }),
    ).toBe(`${OPS_WORKSPACE_PATH}?tab=crm&tour=staff-crm-workspace`)
  })

  it('renders task, follow-up, source, and tour cards and launches the recommended tour target', async () => {
    const { RecordList, SourcesList, TourList } = await import('@/components/copilot/PortalCopilotPanels')

    render(
      <div>
        <RecordList
          emptyLabel="No tasks."
          items={[
            {
              href: '/admin/collections/crm-tasks/2',
              id: '2',
              kind: 'task',
              meta: ['Due today', 'Commercial'],
              priorityLabel: 'High',
              stale: false,
              statusLabel: 'Open',
              subtitle: 'Call after estimate',
              title: 'Quote follow-up',
            },
          ]}
          title="Assigned tasks"
        />
        <RecordList
          emptyLabel="No follow-up."
          items={[
            {
              href: '/admin/collections/leads/1',
              id: '1',
              kind: 'lead',
              meta: ['555-0101'],
              stale: true,
              statusLabel: 'Working',
              subtitle: 'Hot follow-up',
              title: 'Acme lead',
            },
          ]}
          title="Follow-up queue"
        />
        <TourList
          tours={[
            {
              blurb: 'Queues, search, and field leads',
              id: 'staff-crm-workspace',
              label: 'Ops workspace',
              opsTab: 'crm',
              path: OPS_WORKSPACE_PATH,
            },
          ]}
        />
        <SourcesList
          sources={[
            {
              chunkId: 'lead-runbook:follow-up',
              content: 'Send the quote the same day.',
              heading: 'Quote follow-up',
              score: 0.91,
              slug: 'lead-to-customer-runbook',
              sourcePath: 'src/content/docs/lead-to-customer-runbook.md',
              title: 'Lead to customer runbook',
            },
          ]}
        />
      </div>,
    )

    expect(screen.getByText('Assigned tasks')).toBeTruthy()
    expect(screen.getAllByText('Quote follow-up').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Follow-up queue')).toBeTruthy()
    expect(screen.getByText('Acme lead')).toBeTruthy()
    expect(screen.getByText('Stale')).toBeTruthy()
    expect(screen.getByText('Internal doc sources')).toBeTruthy()
    expect(screen.getByText('Lead to customer runbook')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Ops workspace/i }))

    expect(push).toHaveBeenCalledWith(`${OPS_WORKSPACE_PATH}?tab=crm&tour=staff-crm-workspace`)
  })
})
