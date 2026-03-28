import type { LucideIcon } from 'lucide-react'
import {
  Building2Icon,
  FileBarChart2Icon,
  FolderTreeIcon,
  ReceiptTextIcon,
  TimerResetIcon,
  WrenchIcon,
} from 'lucide-react'

export const OPS_SECTION_IDS = ['today', 'crm', 'billing', 'scorecard', 'milestones', 'assets'] as const

export type OpsSectionId = (typeof OPS_SECTION_IDS)[number]

export type OpsSectionMeta = {
  defaultDetailBody: string
  defaultDetailDescription: string
  href: string
  icon: LucideIcon
  label: string
  pageDescription: string
  pageTitle: string
  railDescription: string
}

export const OPS_SECTION_META: Record<OpsSectionId, OpsSectionMeta> = {
  assets: {
    defaultDetailBody:
      'Asset details, current status, and ops notes stay visible here so the live equipment inventory can be managed without leaving the workspace.',
    defaultDetailDescription: 'Asset inventory detail',
    href: '/ops/workspace?tab=assets',
    icon: WrenchIcon,
    label: 'assets.stack',
    pageDescription: 'Track and manage the equipment the business actually owns and plans to add next.',
    pageTitle: 'Asset inventory',
    railDescription: 'Track and manage the equipment the business actually owns and plans to add next.',
  },
  billing: {
    defaultDetailBody:
      'Billing follow-up keeps invoice sends, overdue cleanup, recurring-plan sync, and monthly commercial batches inside the same ops workspace so staff do not bounce between duplicate cards and admin lists.',
    defaultDetailDescription: 'Billing follow-up context',
    href: '/ops/workspace?tab=billing',
    icon: ReceiptTextIcon,
    label: 'billing.followup',
    pageDescription: 'Invoice follow-up, recurring-plan sync, and monthly commercial billing.',
    pageTitle: 'Billing follow-up',
    railDescription: 'Invoice follow-up, recurring-plan sync, and monthly commercial billing.',
  },
  crm: {
    defaultDetailBody:
      'Customer pipeline detail stays visible here while the queue remains stable on the page. Use the ops workspace to sort stale follow-up, review company context, and log the next action without overlaying the rest of the screen.',
    defaultDetailDescription: 'Ops workspace detail rail',
    href: '/ops/workspace?tab=crm',
    icon: Building2Icon,
    label: 'ops.workspace',
    pageDescription: 'Customer pipeline, companies, contacts, and first-party follow-up queues.',
    pageTitle: 'Ops workspace',
    railDescription: 'Customer pipeline, companies, contacts, and follow-up queues.',
  },
  milestones: {
    defaultDetailBody:
      'Growth unlocks, trigger notes, and win conditions show here so the team can compare milestone standards against the current operating load.',
    defaultDetailDescription: 'Growth milestones and standards',
    href: '/ops/workspace?tab=milestones',
    icon: FolderTreeIcon,
    label: 'milestones.plan',
    pageDescription: 'Growth unlocks and next-stage operating standards.',
    pageTitle: 'Growth milestones',
    railDescription: 'Growth unlocks and next-stage operating standards.',
  },
  scorecard: {
    defaultDetailBody:
      'Scorecard definitions and liability notes open here so KPI logic, manual values, and business drag stay readable without stacking drawers on top of the dashboard.',
    defaultDetailDescription: 'Scorecard detail rail',
    href: '/ops/workspace?tab=scorecard',
    icon: FileBarChart2Icon,
    label: 'scorecard.metrics',
    pageDescription: 'Scorecard definitions, current values, and business drag.',
    pageTitle: 'Scorecard',
    railDescription: 'Scorecard definitions, current values, and business drag.',
  },
  today: {
    defaultDetailBody:
      'The day board keeps route load, scheduled jobs, and current workload decisions in one place. Pick a date or drill into jobs and the selected context stays pinned here.',
    defaultDetailDescription: 'Daily route and schedule context',
    href: '/ops/workspace?tab=today',
    icon: TimerResetIcon,
    label: 'today.board',
    pageDescription: 'Daily route, confirmed jobs, follow-up, and job-flow priorities.',
    pageTitle: 'Today board',
    railDescription: 'Daily route, confirmed jobs, follow-up, and job-flow priorities.',
  },
}

export function getOpsSectionMeta(id: OpsSectionId): OpsSectionMeta {
  return OPS_SECTION_META[id]
}

export function listOpsSectionMeta(): OpsSectionMeta[] {
  return OPS_SECTION_IDS.map((id) => OPS_SECTION_META[id])
}
