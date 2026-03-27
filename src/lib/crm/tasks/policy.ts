import type { CrmSequence, Lead } from '@/payload-types'
import type { ParsedSubmission } from '@/lib/crm/internal/submissionParser'
import {
  buildOperatingRhythmPolicy,
  type OperatingRhythmPolicy,
  type OperatingRoleTag,
} from '@/lib/ops/policies/operatingRhythm'

type SequenceStep = NonNullable<NonNullable<CrmSequence['steps']>[number]>

type BuildLeadQualificationPolicyArgs = {
  customerName: null | string
  now?: Date
  priority: 'high' | 'low' | 'medium' | 'urgent'
}

type BuildQuoteTaskPolicyArgs = {
  accountType: 'commercial' | 'residential'
  customerName: null | string
  now?: Date
  status: 'sent' | 'won'
}

type BuildSequenceTaskPolicyArgs = {
  notes?: null | string
  now?: Date
  priority?: 'high' | 'low' | 'medium' | 'urgent' | null
  taskTitle?: null | string
  taskType?: SequenceStep['taskType']
}

type BuildManualTaskPolicyArgs = {
  nextAction: string
  now?: Date
  priority?: 'high' | 'low' | 'medium' | 'urgent'
  roleTags?: OperatingRoleTag[]
}

export function normalizeSupportRequestKind(value: null | string): ParsedSubmission['requestKind'] {
  switch (value) {
    case 'billing_support':
    case 'refund_request':
    case 'policy_privacy':
    case 'scheduling_support':
    case 'service_follow_up':
    case 'sales':
      return value
    default:
      return 'general_support'
  }
}

export function buildSubmissionTaskPolicy(args: { now?: Date; submission: ParsedSubmission }): OperatingRhythmPolicy {
  const { submission } = args

  if (submission.source === 'schedule_request' || submission.requestKind === 'scheduling_support') {
    return buildOperatingRhythmPolicy({
      now: args.now,
      rule: {
        acknowledgmentBusinessMinutes: submission.accountType === 'commercial' ? 30 : 60,
        escalationBusinessDays: 1,
        nextAction: 'Confirm service window and route details.',
        priority: 'high',
        roleTags: ['scheduler'],
        slaClass: 'scheduling',
        sourceType: 'appointment',
        staleBusinessDays: 1,
      },
    })
  }

  if (submission.requestKind === 'billing_support') {
    return buildOperatingRhythmPolicy({
      now: args.now,
      rule: {
        acknowledgmentBusinessDays: 1,
        escalationBusinessDays: 2,
        nextAction: 'Review invoice history and reply with billing update.',
        priority: 'high',
        roleTags: ['billing-followup'],
        slaClass: 'billing_support',
        sourceType: 'support',
        staleBusinessDays: 1,
      },
    })
  }

  if (submission.requestKind === 'refund_request') {
    return buildOperatingRhythmPolicy({
      now: args.now,
      rule: {
        acknowledgmentBusinessDays: 1,
        escalationBusinessDays: 1,
        nextAction: 'Review service issue, document outcome, and prepare refund decision.',
        priority: 'urgent',
        roleTags: ['billing-followup', 'ops-admin'],
        slaClass: 'refund_request',
        sourceType: 'support',
        staleBusinessDays: 1,
      },
    })
  }

  if (submission.requestKind === 'policy_privacy') {
    return buildOperatingRhythmPolicy({
      now: args.now,
      rule: {
        acknowledgmentBusinessDays: 1,
        escalationBusinessDays: 1,
        nextAction: 'Review policy or privacy request and respond from the admin queue.',
        priority: 'high',
        roleTags: ['ops-admin'],
        slaClass: 'policy_privacy',
        sourceType: 'support',
        staleBusinessDays: 1,
      },
    })
  }

  if (submission.source === 'instant_quote' || submission.requestKind === 'sales') {
    return buildOperatingRhythmPolicy({
      now: args.now,
      rule: {
        acknowledgmentBusinessMinutes: submission.accountType === 'commercial' ? 10 : 30,
        escalationBusinessDays: 1,
        nextAction:
          submission.source === 'instant_quote'
            ? 'Review quote scope and send follow-up.'
            : 'Review lead and send first reply.',
        priority: submission.priority,
        roleTags: ['lead-followup'],
        slaClass: submission.source === 'instant_quote' ? 'quote_follow_up' : 'new_lead',
        sourceType: submission.source === 'instant_quote' ? 'quote' : 'lead',
        staleBusinessDays: 1,
      },
    })
  }

  return buildOperatingRhythmPolicy({
    now: args.now,
    rule: {
      acknowledgmentBusinessDays: 1,
      escalationBusinessDays: 2,
      nextAction:
        submission.requestKind === 'service_follow_up'
          ? 'Review service history and reply with next service update.'
          : 'Reply to support request and capture next step.',
      priority: submission.requestKind === 'service_follow_up' ? 'high' : 'medium',
      roleTags: submission.requestKind === 'service_follow_up' ? ['scheduler'] : ['lead-followup'],
      slaClass: 'general_support',
      sourceType: 'support',
      staleBusinessDays: 1,
    },
  })
}

export function buildLeadQualificationTaskPolicy(args: BuildLeadQualificationPolicyArgs): OperatingRhythmPolicy {
  return buildOperatingRhythmPolicy({
    now: args.now,
    rule: {
      acknowledgmentBusinessDays: 1,
      escalationBusinessDays: 1,
      nextAction: 'Prepare quote or confirm walkthrough details.',
      priority: args.priority,
      roleTags: ['lead-followup'],
      slaClass: 'quote_follow_up',
      sourceType: 'lead',
      staleBusinessDays: 1,
    },
  })
}

export function buildQuoteTaskPolicy(args: BuildQuoteTaskPolicyArgs): OperatingRhythmPolicy {
  if (args.status === 'won') {
    return buildOperatingRhythmPolicy({
      now: args.now,
      rule: {
        acknowledgmentBusinessMinutes: args.accountType === 'commercial' ? 30 : 60,
        escalationBusinessDays: 1,
        nextAction: 'Coordinate the service window and confirm scheduling.',
        priority: args.accountType === 'commercial' ? 'high' : 'medium',
        roleTags: ['scheduler'],
        slaClass: 'scheduling',
        sourceType: 'quote',
        staleBusinessDays: 1,
      },
    })
  }

  return buildOperatingRhythmPolicy({
    now: args.now,
    rule: {
      acknowledgmentBusinessMinutes: args.accountType === 'commercial' ? 10 : 30,
      escalationBusinessDays: 1,
      nextAction: 'Follow up on the sent quote and capture objections or next step.',
      priority: args.accountType === 'commercial' ? 'high' : 'medium',
      roleTags: ['lead-followup'],
      slaClass: 'quote_follow_up',
      sourceType: 'quote',
      staleBusinessDays: 1,
    },
  })
}

export function buildSequenceTaskPolicy(args: BuildSequenceTaskPolicyArgs): OperatingRhythmPolicy {
  const defaultRoleTags: OperatingRoleTag[] =
    args.taskType === 'billing_follow_up'
      ? ['billing-followup']
      : args.taskType === 'scheduling'
        ? ['scheduler']
        : ['lead-followup']

  return buildOperatingRhythmPolicy({
    now: args.now,
    rule: {
      acknowledgmentBusinessDays: 1,
      escalationBusinessDays: 1,
      nextAction: args.notes?.trim() || args.taskTitle?.trim() || 'Complete the sequence follow-up task.',
      priority: args.priority || 'medium',
      roleTags: defaultRoleTags,
      slaClass: args.taskType === 'billing_follow_up' ? 'invoice_overdue' : 'sequence_task',
      sourceType: 'sequence',
      staleBusinessDays: 1,
    },
  })
}

export function buildManualTaskPolicy(args: BuildManualTaskPolicyArgs): OperatingRhythmPolicy {
  return buildOperatingRhythmPolicy({
    now: args.now,
    rule: {
      acknowledgmentBusinessDays: 1,
      escalationBusinessDays: 2,
      nextAction: args.nextAction,
      priority: args.priority || 'medium',
      roleTags: args.roleTags?.length ? args.roleTags : ['ops-admin'],
      slaClass: 'manual_follow_up',
      sourceType: 'manual',
      staleBusinessDays: 1,
    },
  })
}

export function buildLeadWorkspaceFollowUpPolicy(args: {
  lead: Lead
  now?: Date
}): OperatingRhythmPolicy {
  return buildLeadQualificationTaskPolicy({
    customerName: args.lead.customerName ?? null,
    now: args.now,
    priority: args.lead.priority,
  })
}
