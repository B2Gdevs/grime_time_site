import { describe, expect, it, vi } from 'vitest'

import { OPS_WORKSPACE_PATH } from '@/lib/navigation/portalPaths'

vi.mock('@/lib/crm/workspace', () => ({
  loadCrmWorkspace: vi.fn(async () => ({
    generatedAt: new Date().toISOString(),
    metrics: [],
    ownerScope: 'mine',
    queues: [
      {
        description: 'attention',
        emptyMessage: 'none',
        items: [
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
        ],
        key: 'attention',
        label: 'Needs attention',
      },
      {
        description: 'tasks',
        emptyMessage: 'none',
        items: [
          {
            href: '/admin/collections/crm-tasks/2',
            id: '2',
            kind: 'task',
            meta: ['Due today'],
            stale: false,
            statusLabel: 'Open',
            subtitle: 'Call after estimate',
            title: 'Quote follow-up',
          },
        ],
        key: 'tasks',
        label: 'Tasks',
      },
    ],
  })),
}))

describe('AI ops insight shaping', () => {
  it('builds task, follow-up, and recommended-tour bundles for the operator', async () => {
    const { buildCopilotInsights } = await import('@/lib/ai/ops-context')

    const insights = await buildCopilotInsights({
      currentPath: OPS_WORKSPACE_PATH,
      isRealAdmin: true,
      payload: {} as never,
      query: 'Who should I follow up with in CRM?',
      user: {
        email: 'ops@grimetime.app',
        id: 44,
        name: 'Ops Lead',
      } as never,
    })

    expect(insights.operator.name).toBe('Ops Lead')
    expect(insights.tasks[0]?.title).toBe('Quote follow-up')
    expect(insights.followUps[0]?.title).toBe('Acme lead')
    expect(insights.recommendedTours.some((tour) => tour.id === 'staff-crm-workspace')).toBe(true)
    expect(insights.recommendedTours.find((tour) => tour.id === 'staff-crm-workspace')?.opsTab).toBe('crm')
  })
})
