import type { Step } from 'react-joyride'

import {
  CUSTOMER_DASHBOARD_PATH,
  OPS_DASHBOARD_PATH,
  OPS_WORKSPACE_PATH,
} from '@/lib/navigation/portalPaths'
import type { OpsSectionId } from '@/lib/ops/uiMeta'

/** Who the tour is for — drives sidebar grouping and autolaunch rules. */
export type PortalTourAudience = 'customer' | 'staff'

/** Portal routes that have Joyride targets (excluding `/ops` tab variants). */
export type PortalTourPath =
  | '/account'
  | typeof CUSTOMER_DASHBOARD_PATH
  | '/docs'
  | '/estimates'
  | '/invoices'
  | typeof OPS_DASHBOARD_PATH
  | typeof OPS_WORKSPACE_PATH
  | '/service-schedule'

export const PORTAL_TOUR_IDS = [
  'ops-dashboard',
  'customer-dashboard',
  'staff-crm-workspace',
  'staff-today-board',
  'staff-scorecard-liabilities',
  'staff-assets-ladder',
  'staff-milestones',
  'staff-portal-docs',
  'customer-estimates',
  'customer-invoices',
  'customer-schedule',
  'customer-account',
] as const
export type PortalTourId = (typeof PORTAL_TOUR_IDS)[number]

export type PortalTourDefinition = {
  id: PortalTourId
  audience: PortalTourAudience
  label: string
  blurb: string
  path: PortalTourPath
  opsTab?: OpsSectionId
  staffAutolaunch?: boolean
  steps: Step[]
}

const opsOverviewSteps: Step[] = [
  {
    target: '[data-tour="portal-nav-main"]',
    title: 'Workspace navigation',
    content:
      'Switch between Ops (internal) and Customer home (what the homeowner sees). Field work, CRM, and quotes live on Ops; use Customer home when you are showing the portal beside a client.',
    placement: 'right',
  },
  {
    target: '[data-tour="portal-header"]',
    title: 'Page context',
    content:
      'The header titles the area you are in. Collapse the sidebar on small screens so you have more room when quoting or triaging on a tablet.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="portal-kpi-cards"]',
    title: 'Pulse metrics',
    content:
      'Scan pipeline, tasks, and health before you dive into the command center or CRM. This is your daily check-in strip.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="portal-command-center"]',
    title: 'Command center',
    content:
      'Today board, CRM, scorecard (with liabilities), milestones, and asset inventory share one rail. Pick a section on the left; details stay in the rail and right pane so nothing covers the dashboard.',
    placement: 'top',
  },
  {
    target: '[data-tour="portal-command-rail"]',
    title: 'Section tabs',
    content:
      'Use these tabs to move between daily route work, CRM queues, KPIs and drag, growth milestones, and equipment decisions. Each deep tour below starts on the right tab for you.',
    placement: 'right',
  },
  {
    target: '[data-tour="portal-operator-panel"]',
    title: 'Payload shortcuts',
    content:
      'Open leads, tasks, quotes, opportunities, sequences, or full Payload admin when you need the full record. Day-to-day triage still starts in the command center.',
    placement: 'left',
  },
]

const customerDashboardSteps: Step[] = [
  {
    target: '[data-tour="portal-nav-main"]',
    title: 'Your account areas',
    content:
      'Estimates, invoices, schedule, and account settings live here — one flow for residential and commercial customers.',
    placement: 'right',
  },
  {
    target: '[data-tour="portal-header"]',
    title: 'Where you are',
    content: 'The header shows which part of your account you are viewing.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="portal-kpi-cards"]',
    title: 'Status at a glance',
    content:
      'Summary cards surface visits, billing, and plan context. Staff see the same layout when they preview your account.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="portal-customer-quick-actions"]',
    title: 'Next steps',
    content:
      'Jump to estimates, schedule, invoices, account updates, or contact. This is the main self-service path after the website or office sets you up.',
    placement: 'left',
  },
]

const staffCrmSteps: Step[] = [
  {
    target: '[data-tour="portal-command-rail"]',
    title: 'CRM tab',
    content:
      'Select the CRM section to work first-party queues: attention items, pipeline, accounts, tasks, and automation — no separate CRM product required.',
    placement: 'right',
  },
  {
    target: '[data-tour="portal-crm-workspace"]',
    title: 'Queues and records',
    content:
      'Door-to-door and field leads land here with the rest of inbound work. Search, filter stale items, switch queues, and open a row to load structured detail in the left rail. Website captures and on-site quotes tied to the same email or phone should use one contact identity; if a customer wants a different price, create another quote for that same contact and reconcile which opportunity closed when the job completes.',
    placement: 'bottom',
  },
]

const staffTodaySteps: Step[] = [
  {
    target: '[data-tour="portal-today-board"]',
    title: 'Daily operating board',
    content:
      'Use this board for the day’s route: scheduled jobs, requests, and workload. It complements CRM — CRM holds pipeline and follow-up; Today holds what is on the truck or calendar. Recurring service and subscription context still ties back to accounts and quotes in CRM and the customer portal.',
    placement: 'bottom',
  },
]

const staffScorecardSteps: Step[] = [
  {
    target: '[data-tour="portal-scorecard-panel"]',
    title: 'Scorecard and liabilities',
    content:
      'KPI definitions, manual values, and liability rows stay visible together so you see both targets and business drag (debt, tax, or operational weight) without digging through spreadsheets.',
    placement: 'bottom',
  },
]

const staffAssetsSteps: Step[] = [
  {
    target: '[data-tour="portal-assets-panel"]',
    title: 'Asset inventory',
    content:
      'Track the equipment the business actually has, then add planned purchases in the same inventory. Payload-backed rows stay editable while the portal shows the live asset table.',
    placement: 'bottom',
  },
]

const staffMilestonesSteps: Step[] = [
  {
    target: '[data-tour="portal-command-rail"]',
    title: 'Milestones tab',
    content: 'Open the milestones section to compare growth unlocks and operating standards against current load.',
    placement: 'right',
  },
  {
    target: '[data-tour="portal-milestones-panel"]',
    title: 'Growth ladder',
    content:
      'Milestone rows are editable in Payload; the portal shows what the team is aiming for at each stage so planning stays visible next to the rest of the command center.',
    placement: 'bottom',
  },
]

const staffPortalDocsSteps: Step[] = [
  {
    target: '[data-tour="portal-docs-index"]',
    title: 'Guide library',
    content:
      'Browse internal playbooks and customer help articles registered in the docs catalog. Admins see both; customers only see audience-appropriate guides elsewhere.',
    placement: 'right',
  },
  {
    target: '[data-tour="portal-docs-reader"]',
    title: 'Reader',
    content:
      'Preview markdown here or open a doc for the full page. Use this when you need the quote playbook, scorecard notes, or field process reminders beside `/ops`.',
    placement: 'left',
  },
]

const customerSurfaceSteps = (surface: string): Step[] => [
  {
    target: '[data-tour="portal-header"]',
    title: 'This area',
    content: `You are in ${surface}. The header stays consistent across the portal so you always know where you are.`,
    placement: 'bottom',
  },
  {
    target: '[data-tour="portal-page-body"]',
    title: 'What to do here',
    content:
      surface === 'Estimates'
        ? 'Review scoped quotes tied to your account. Request a new quote from the button when you need another estimate.'
        : surface === 'Invoices'
          ? 'Track balance due, due dates, and payment links when Stripe billing is connected.'
          : surface === 'Schedule'
            ? 'See upcoming visits, recurring plan context, and use the request form to propose changes.'
            : 'Keep profile, service, and billing addresses current so crews and invoices stay accurate.',
    placement: 'top',
  },
]

export const portalTourRegistry: Record<PortalTourId, PortalTourDefinition> = {
  'ops-dashboard': {
    id: 'ops-dashboard',
    audience: 'staff',
    label: 'Ops overview',
    blurb: 'Start here — autolaunches once for staff',
    path: OPS_DASHBOARD_PATH,
    staffAutolaunch: true,
    steps: opsOverviewSteps,
  },
  'customer-dashboard': {
    id: 'customer-dashboard',
    audience: 'customer',
    label: 'Customer portal',
    blurb: 'For homeowners and commercial account users',
    path: CUSTOMER_DASHBOARD_PATH,
    steps: customerDashboardSteps,
  },
  'staff-crm-workspace': {
    id: 'staff-crm-workspace',
    audience: 'staff',
    label: 'Ops workspace',
    blurb: 'Queues, search, and field leads',
    path: OPS_WORKSPACE_PATH,
    opsTab: 'crm',
    steps: staffCrmSteps,
  },
  'staff-today-board': {
    id: 'staff-today-board',
    audience: 'staff',
    label: 'Today board',
    blurb: 'Routes, jobs, and daily workload',
    path: OPS_DASHBOARD_PATH,
    opsTab: 'today',
    steps: staffTodaySteps,
  },
  'staff-scorecard-liabilities': {
    id: 'staff-scorecard-liabilities',
    audience: 'staff',
    label: 'Scorecard & liabilities',
    blurb: 'KPIs and business drag',
    path: OPS_DASHBOARD_PATH,
    opsTab: 'scorecard',
    steps: staffScorecardSteps,
  },
  'staff-assets-ladder': {
    id: 'staff-assets-ladder',
    audience: 'staff',
    label: 'Asset inventory',
    blurb: 'Current equipment and planned additions',
    path: OPS_DASHBOARD_PATH,
    opsTab: 'assets',
    steps: staffAssetsSteps,
  },
  'staff-milestones': {
    id: 'staff-milestones',
    audience: 'staff',
    label: 'Milestones',
    blurb: 'Growth ladder and standards',
    path: OPS_DASHBOARD_PATH,
    opsTab: 'milestones',
    steps: staffMilestonesSteps,
  },
  'staff-portal-docs': {
    id: 'staff-portal-docs',
    audience: 'staff',
    label: 'Portal Docs',
    blurb: 'Playbooks and help library',
    path: '/docs',
    steps: staffPortalDocsSteps,
  },
  'customer-estimates': {
    id: 'customer-estimates',
    audience: 'customer',
    label: 'Estimates',
    blurb: 'Quote list and new request',
    path: '/estimates',
    steps: customerSurfaceSteps('Estimates'),
  },
  'customer-invoices': {
    id: 'customer-invoices',
    audience: 'customer',
    label: 'Invoices',
    blurb: 'Balances and payments',
    path: '/invoices',
    steps: customerSurfaceSteps('Invoices'),
  },
  'customer-schedule': {
    id: 'customer-schedule',
    audience: 'customer',
    label: 'Schedule',
    blurb: 'Visits, plans, requests',
    path: '/service-schedule',
    steps: customerSurfaceSteps('Schedule'),
  },
  'customer-account': {
    id: 'customer-account',
    audience: 'customer',
    label: 'Account',
    blurb: 'Profile and addresses',
    path: '/account',
    steps: customerSurfaceSteps('Account'),
  },
}

export function isPortalTourId(value: string | null | undefined): value is PortalTourId {
  return typeof value === 'string' && (PORTAL_TOUR_IDS as readonly string[]).includes(value)
}

export function listToursByAudience(audience: PortalTourAudience): PortalTourDefinition[] {
  return PORTAL_TOUR_IDS.map((id) => portalTourRegistry[id]).filter((t) => t.audience === audience)
}
