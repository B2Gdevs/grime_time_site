import type { Payload } from 'payload'

import { computeSequenceRunDate } from '@/lib/automation/sequences/delay'
import { queueSequenceEnrollmentStep } from '@/lib/automation/sequences/queue'
import { renderSequenceEmail } from '@/lib/automation/sequences/templates'
import { buildCrmTaskData } from '@/lib/crm/tasks/data'
import { buildSequenceTaskPolicy } from '@/lib/crm/tasks/policy'
import type { SequenceEnrollment, CrmSequence } from '@/payload-types'

async function loadEnrollment(payload: Payload, enrollmentId: number | string) {
  return (await payload.findByID({
    collection: 'sequence-enrollments',
    depth: 2,
    id: enrollmentId,
    overrideAccess: true,
  })) as SequenceEnrollment
}

function normalizeDefinition(enrollment: SequenceEnrollment) {
  return typeof enrollment.sequenceDefinition === 'object' && enrollment.sequenceDefinition
    ? (enrollment.sequenceDefinition as CrmSequence)
    : null
}

async function updateEnrollment(
  payload: Payload,
  enrollment: SequenceEnrollment,
  data: Partial<SequenceEnrollment>,
) {
  return (await payload.update({
    collection: 'sequence-enrollments',
    id: enrollment.id,
    data,
    overrideAccess: true,
  })) as SequenceEnrollment
}

async function markCompleted(payload: Payload, enrollment: SequenceEnrollment, exitReason: string) {
  await updateEnrollment(payload, enrollment, {
    exitReason,
    lastError: null,
    lastRunAt: new Date().toISOString(),
    nextRunAt: null,
    status: 'completed',
  })
}

async function createSequenceTask(args: {
  enrollment: SequenceEnrollment
  payload: Payload
  step: NonNullable<CrmSequence['steps']>[number]
}) {
  const title = args.step.taskTitle?.trim() || `${args.enrollment.title} follow-up`
  const policy = buildSequenceTaskPolicy({
    notes: args.step.internalNotes,
    priority: args.step.taskPriority,
    taskTitle: title,
    taskType: args.step.taskType,
  })

  await (args.payload as any).create({
    collection: 'crm-tasks',
    data: buildCrmTaskData({
      account:
        typeof args.enrollment.account === 'object' && args.enrollment.account
          ? args.enrollment.account.id
          : args.enrollment.account || undefined,
      contact:
        typeof args.enrollment.contact === 'object' && args.enrollment.contact
          ? args.enrollment.contact.id
          : args.enrollment.contact || undefined,
      invoice:
        typeof args.enrollment.invoice === 'object' && args.enrollment.invoice
          ? args.enrollment.invoice.id
          : args.enrollment.invoice || undefined,
      lead:
        typeof args.enrollment.lead === 'object' && args.enrollment.lead
          ? args.enrollment.lead.id
          : args.enrollment.lead || undefined,
      notes: args.step.internalNotes || undefined,
      opportunity:
        typeof args.enrollment.opportunity === 'object' && args.enrollment.opportunity
          ? args.enrollment.opportunity.id
          : args.enrollment.opportunity || undefined,
      owner:
        typeof args.enrollment.owner === 'object' && args.enrollment.owner
          ? args.enrollment.owner.id
          : args.enrollment.owner || undefined,
      policy,
      quote:
        typeof args.enrollment.quote === 'object' && args.enrollment.quote
          ? args.enrollment.quote.id
          : args.enrollment.quote || undefined,
      taskType: args.step.taskType || 'general',
      title,
    }),
    overrideAccess: true,
  })
}

async function recordSequenceActivity(args: {
  body: string
  enrollment: SequenceEnrollment
  payload: Payload
  title: string
}) {
  await args.payload.create({
    collection: 'crm-activities',
    data: {
      account:
        typeof args.enrollment.account === 'object' && args.enrollment.account
          ? args.enrollment.account.id
          : args.enrollment.account || undefined,
      activityType: 'system',
      body: args.body,
      contact:
        typeof args.enrollment.contact === 'object' && args.enrollment.contact
          ? args.enrollment.contact.id
          : args.enrollment.contact || undefined,
      direction: 'system',
      invoice:
        typeof args.enrollment.invoice === 'object' && args.enrollment.invoice
          ? args.enrollment.invoice.id
          : args.enrollment.invoice || undefined,
      lead:
        typeof args.enrollment.lead === 'object' && args.enrollment.lead
          ? args.enrollment.lead.id
          : args.enrollment.lead || undefined,
      occurredAt: new Date().toISOString(),
      opportunity:
        typeof args.enrollment.opportunity === 'object' && args.enrollment.opportunity
          ? args.enrollment.opportunity.id
          : args.enrollment.opportunity || undefined,
      owner:
        typeof args.enrollment.owner === 'object' && args.enrollment.owner
          ? args.enrollment.owner.id
          : args.enrollment.owner || undefined,
      quote:
        typeof args.enrollment.quote === 'object' && args.enrollment.quote
          ? args.enrollment.quote.id
          : args.enrollment.quote || undefined,
      servicePlan:
        typeof args.enrollment.servicePlan === 'object' && args.enrollment.servicePlan
          ? args.enrollment.servicePlan.id
          : args.enrollment.servicePlan || undefined,
      title: args.title,
    },
    overrideAccess: true,
  })
}

async function queueNext(args: {
  enrollment: SequenceEnrollment
  nextStepIndex: number
  payload: Payload
  waitUntil?: Date
}) {
  const updated = await updateEnrollment(args.payload, args.enrollment, {
    lastError: null,
    lastRunAt: new Date().toISOString(),
    nextRunAt: args.waitUntil ? args.waitUntil.toISOString() : new Date().toISOString(),
    status: 'active',
    stepIndex: args.nextStepIndex,
  })

  await queueSequenceEnrollmentStep({
    enrollmentId: updated.id,
    payload: args.payload,
    waitUntil: args.waitUntil,
  })
}

export async function processSequenceEnrollmentStep(payload: Payload, enrollmentId: number | string) {
  const enrollment = await loadEnrollment(payload, enrollmentId)

  if (!['queued', 'active'].includes(enrollment.status)) {
    return
  }

  const definition = normalizeDefinition(enrollment)
  const step = definition?.steps?.[enrollment.stepIndex]

  if (!definition || !step) {
    await markCompleted(payload, enrollment, 'No further steps to run.')
    return
  }

  if (step.stepType === 'finish') {
    await markCompleted(payload, enrollment, 'Sequence finished.')
    return
  }

  if (step.stepType === 'wait') {
    const waitUntil = computeSequenceRunDate({
      amount: step.delayAmount || 0,
      businessDaysOnly: definition.settings?.businessDaysOnly,
      sendWindowEndHour: definition.settings?.sendWindowEndHour,
      sendWindowStartHour: definition.settings?.sendWindowStartHour,
      unit: step.delayUnit || 'days',
    })

    await queueNext({
      enrollment,
      nextStepIndex: enrollment.stepIndex + 1,
      payload,
      waitUntil,
    })
    return
  }

  if (step.stepType === 'send_email' && step.emailTemplateKey) {
    const rendered = await renderSequenceEmail({
      enrollment,
      payload,
      templateKey: step.emailTemplateKey,
    })

    if (rendered) {
      await payload.sendEmail({
        html: rendered.message.html,
        subject: step.emailSubject?.trim() || rendered.message.subject,
        text: rendered.message.text,
        to: rendered.to,
      })

      await recordSequenceActivity({
        body: `Sequence email sent using template ${step.emailTemplateKey}.`,
        enrollment,
        payload,
        title: `Sequence email: ${step.emailTemplateKey}`,
      })
    }
  }

  if (step.stepType === 'create_task') {
    await createSequenceTask({
      enrollment,
      payload,
      step,
    })

    await recordSequenceActivity({
      body: `Sequence task created: ${step.taskTitle || 'Follow-up task'}.`,
      enrollment,
      payload,
      title: 'Sequence task created',
    })
  }

  const nextStep = definition.steps?.[enrollment.stepIndex + 1]
  if (!nextStep) {
    await markCompleted(payload, enrollment, 'Sequence completed.')
    return
  }

  await queueNext({
    enrollment,
    nextStepIndex: enrollment.stepIndex + 1,
    payload,
  })
}
