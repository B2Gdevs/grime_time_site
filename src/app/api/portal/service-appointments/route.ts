import { requirePayloadUser } from '@/lib/auth/requirePayloadUser'
import { customerScheduleRequestSchema } from '@/lib/forms/customerScheduleRequest'
import type { Quote, ServiceAppointment, ServicePlan } from '@/payload-types'

function titleFromSource(args: {
  plan?: null | ServicePlan
  quote?: null | Quote
}) {
  if (args.plan?.title) return `Plan visit - ${args.plan.title}`
  if (args.quote?.title) return `Schedule - ${args.quote.title}`
  return 'Customer schedule request'
}

export async function POST(request: Request) {
  const auth = await requirePayloadUser(request)

  if (!auth) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = customerScheduleRequestSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message || 'Invalid scheduling payload.' },
      { status: 400 },
    )
  }

  const payloadData = parsed.data

  if (payloadData.existingAppointmentId) {
    const existing = (await auth.payload.findByID({
      collection: 'service-appointments',
      depth: 0,
      id: payloadData.existingAppointmentId,
      overrideAccess: false,
      user: auth.user,
    })) as ServiceAppointment

    await auth.payload.update({
      collection: 'service-appointments',
      id: existing.id,
      data: {
        arrivalWindow: payloadData.window,
        customerNotes: payloadData.notes,
        requestedDate: payloadData.preferredDate || existing.requestedDate,
        status: 'reschedule_requested',
      },
      overrideAccess: true,
    })

    return Response.json({
      message: 'Your schedule change request is in. The team will confirm the updated slot.',
    })
  }

  const quote = payloadData.quoteId
    ? ((await auth.payload.findByID({
        collection: 'quotes',
        depth: 0,
        id: payloadData.quoteId,
        overrideAccess: false,
        user: auth.user,
      })) as Quote)
    : null

  const servicePlan = payloadData.servicePlanId
    ? ((await auth.payload.findByID({
        collection: 'service-plans',
        depth: 0,
        id: payloadData.servicePlanId,
        overrideAccess: false,
        user: auth.user,
      })) as ServicePlan)
    : null

  await auth.payload.create({
    collection: 'service-appointments',
    data: {
      arrivalWindow: payloadData.window,
      customerEmail: auth.user.email,
      customerName: auth.user.name,
      customerNotes: payloadData.notes,
      customerUser: auth.user.id,
      relatedQuote: quote?.id,
      requestSource: 'portal',
      requestedDate: payloadData.preferredDate || undefined,
      serviceAddress: quote?.serviceAddress || servicePlan?.serviceAddress || auth.user.serviceAddress,
      servicePlan: servicePlan?.id,
      status: 'requested',
      title: titleFromSource({ plan: servicePlan, quote }),
    },
    overrideAccess: true,
  })

  return Response.json({
    message: 'Your scheduling request is in. We will confirm the route and arrival window.',
  })
}
