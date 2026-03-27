import type { CrmTask } from '@/payload-types'
import type { OperatingRhythmPolicy } from '@/lib/ops/policies/operatingRhythm'

type CrmTaskRelationshipSeed = Pick<
  Partial<CrmTask>,
  'account' | 'contact' | 'invoice' | 'lead' | 'opportunity' | 'quote' | 'serviceAppointment' | 'servicePlan'
>

type BuildCrmTaskDataArgs = CrmTaskRelationshipSeed & {
  notes?: null | string
  owner?: null | number
  policy: OperatingRhythmPolicy
  taskType?: CrmTask['taskType']
  title: string
}

export function buildCrmTaskData(args: BuildCrmTaskDataArgs): Record<string, unknown> {
  return {
    account: args.account,
    contact: args.contact,
    dueAt: args.policy.dueAt,
    escalatesAt: args.policy.escalatesAt,
    invoice: args.invoice,
    lead: args.lead,
    nextAction: args.policy.nextAction,
    notes: args.notes || undefined,
    opportunity: args.opportunity,
    owner: args.owner || undefined,
    priority: args.policy.priority,
    quote: args.quote,
    roleTags: [...args.policy.roleTags],
    serviceAppointment: args.serviceAppointment,
    servicePlan: args.servicePlan,
    slaClass: args.policy.slaClass,
    slaTargetAt: args.policy.slaTargetAt,
    sourceType: args.policy.sourceType,
    staleAt: args.policy.staleAt,
    status: 'open',
    taskType: args.taskType || 'general',
    title: args.title,
  }
}
