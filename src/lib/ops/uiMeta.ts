import type { LucideIcon } from 'lucide-react'
import {
  Building2Icon,
  FileBarChart2Icon,
  FolderTreeIcon,
  TimerResetIcon,
  WrenchIcon,
} from 'lucide-react'

export const OPS_SECTION_IDS = ['today', 'crm', 'scorecard', 'milestones', 'assets'] as const

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
      'Asset decisions, buy notes, and why-now guidance show here so equipment planning stays visible without burying the active work surface.',
    defaultDetailDescription: 'Equipment and software guidance',
    href: '/ops/assets',
    icon: WrenchIcon,
    label: 'assets.stack',
    pageDescription: 'Equipment and software decisions by bottleneck.',
    pageTitle: 'Asset ladder',
    railDescription: 'Equipment and software decisions by bottleneck.',
  },
  crm: {
    defaultDetailBody:
      'CRM detail stays visible here while the queue remains stable on the page. Use the workspace to sort stale follow-up, review company context, and log the next action without overlaying the rest of the screen.',
    defaultDetailDescription: 'CRM detail rail',
    href: '/ops/crm',
    icon: Building2Icon,
    label: 'crm.workspace',
    pageDescription: 'First-party CRM queues, companies, contacts, and automation.',
    pageTitle: 'CRM workspace',
    railDescription: 'First-party CRM queues, companies, contacts, and automation.',
  },
  milestones: {
    defaultDetailBody:
      'Growth unlocks, trigger notes, and win conditions show here so the team can compare milestone standards against the current operating load.',
    defaultDetailDescription: 'Growth milestones and standards',
    href: '/ops/milestones',
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
    href: '/ops/scorecard',
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
    href: '/ops/today',
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
