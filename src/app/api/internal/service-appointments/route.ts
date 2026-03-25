import { requirePayloadUser } from '@/lib/auth/requirePayloadUser'
import { userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import type { ServiceAppointment } from '@/payload-types'

function isSameMonth(date: Date, year: number, monthIndex: number): boolean {
  return date.getFullYear() === year && date.getMonth() === monthIndex
}

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export async function GET(request: Request) {
  const auth = await requirePayloadUser(request)

  if (!auth || !userIsAdmin(auth.user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const date = url.searchParams.get('date')?.trim()
  const month = url.searchParams.get('month')?.trim()

  const monthMatch = month ? /^(\d{4})-(\d{2})$/.exec(month) : null
  if (!monthMatch) {
    return Response.json({ error: 'Invalid or missing month=YYYY-MM' }, { status: 400 })
  }

  const monthYear = Number(monthMatch[1])
  const monthIndex = Number(monthMatch[2]) - 1

  const result = await auth.payload.find({
    collection: 'service-appointments',
    depth: 0,
    limit: 500,
    overrideAccess: false,
    sort: 'scheduledStart',
    user: auth.user,
  })

  const appointments = (result.docs as ServiceAppointment[])
    .map((appointment) => {
      const sourceDate = appointment.scheduledStart || appointment.requestedDate
      const parsed = sourceDate ? new Date(sourceDate) : null

      return {
        arrivalWindow: appointment.arrivalWindow ?? null,
        customerName: appointment.customerName ?? appointment.customerEmail ?? 'Customer',
        dateKey: parsed && !Number.isNaN(parsed.getTime()) ? localDateKey(parsed) : null,
        id: String(appointment.id),
        scheduledStart: appointment.scheduledStart ?? null,
        status: appointment.status,
        title: appointment.title,
      }
    })
    .filter((appointment) => {
      if (!appointment.dateKey) return false
      const parsed = new Date(appointment.scheduledStart ?? appointment.dateKey)
      return !Number.isNaN(parsed.getTime()) && isSameMonth(parsed, monthYear, monthIndex)
    })

  const counts = new Map<string, number>()
  for (const appointment of appointments) {
    const current = counts.get(appointment.dateKey as string) ?? 0
    counts.set(appointment.dateKey as string, current + 1)
  }

  return Response.json({
    appointments: date ? appointments.filter((appointment) => appointment.dateKey === date) : [],
    monthJobCounts: Array.from(counts.entries()).map(([dateKey, count]) => ({
      count,
      date: dateKey,
    })),
  })
}
