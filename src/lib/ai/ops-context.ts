import { portalTourRegistry, type PortalTourId } from '@/lib/tours/registry'
import { loadCrmWorkspace } from '@/lib/crm/workspace'
import type { User } from '@/payload-types'
import type { Payload } from 'payload'

import type { CopilotInsightBundle, CopilotTourSuggestion } from './types'

function uniqueTours(ids: PortalTourId[]): CopilotTourSuggestion[] {
  return Array.from(new Set(ids)).map((id) => {
    const tour = portalTourRegistry[id]
    return {
      blurb: tour.blurb,
      id: tour.id,
      label: tour.label,
      opsTab: tour.opsTab,
      path: tour.path,
    }
  })
}

function recommendedTourIds(args: { currentPath?: string; query: string }): PortalTourId[] {
  const query = args.query.toLowerCase()
  const ids: PortalTourId[] = []

  if (args.currentPath?.startsWith('/ops/workspace')) {
    ids.push('staff-crm-workspace')
  } else if (args.currentPath?.startsWith('/ops')) {
    ids.push('ops-dashboard')
  } else if (args.currentPath?.startsWith('/docs')) {
    ids.push('staff-portal-docs')
  }

  if (/(lead|crm|follow[\s-]?up|contact|queue)/.test(query)) ids.push('staff-crm-workspace')
  if (/(today|route|schedule|day board|truck)/.test(query)) ids.push('staff-today-board')
  if (/(asset|equipment|machine|ladder)/.test(query)) ids.push('staff-assets-ladder')
  if (/(milestone|growth|target|scorecard|kpi)/.test(query)) ids.push('staff-milestones', 'staff-scorecard-liabilities')
  if (/(doc|playbook|policy|guide|how do i)/.test(query)) ids.push('staff-portal-docs')

  if (ids.length === 0) {
    ids.push('ops-dashboard', 'staff-crm-workspace')
  }

  return ids
}

export async function buildCopilotInsights(args: {
  currentPath?: string
  isRealAdmin: boolean
  payload: Payload
  query: string
  user: User
}): Promise<CopilotInsightBundle> {
  const workspace = await loadCrmWorkspace({
    ownerScope: 'mine',
    payload: args.payload,
    user: args.user,
  })

  const tasks = workspace.queues.find((queue) => queue.key === 'tasks')?.items.slice(0, 4) ?? []
  const followUps = workspace.queues.find((queue) => queue.key === 'attention')?.items.slice(0, 4) ?? []

  return {
    followUps,
    operator: {
      email: args.user.email ?? '',
      isRealAdmin: args.isRealAdmin,
      name: args.user.name || args.user.email || 'Operator',
    },
    query: args.query,
    recommendedTours: uniqueTours(recommendedTourIds({ currentPath: args.currentPath, query: args.query })),
    tasks,
  }
}
