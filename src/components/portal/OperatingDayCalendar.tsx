'use client'

import * as React from 'react'

import { Calendar } from '@/components/ui/calendar'
import { weekendOpsMessage } from '@/lib/ops/internalDashboardData'

type HubSpotTaskRow = {
  id: string
  ownerId: string | null
  ownerName?: string | null
  status: string | null
  subject: string
}

type ServiceAppointmentRow = {
  arrivalWindow: null | string
  customerName: string
  dateKey: null | string
  id: string
  scheduledStart: null | string
  status: string
  title: string
}

function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

function dateKeyLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function monthKeyLocal(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function sentenceCase(value: null | string | undefined): string {
  if (!value) return 'Not set'
  return value
    .split('_')
    .filter(Boolean)
    .map((part, index) =>
      index === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part.toLowerCase(),
    )
    .join(' ')
}

export function OperatingDayCalendar({ hubSpotOpsEnabled }: { hubSpotOpsEnabled: boolean }) {
  const [selected, setSelected] = React.useState<Date | undefined>(() => new Date())
  const [month, setMonth] = React.useState<Date>(() => new Date())
  const [timeZone, setTimeZone] = React.useState<string | undefined>(undefined)
  const [tasks, setTasks] = React.useState<HubSpotTaskRow[]>([])
  const [appointments, setAppointments] = React.useState<ServiceAppointmentRow[]>([])
  const [monthAppointmentCounts, setMonthAppointmentCounts] = React.useState<Record<string, number>>({})
  const [loadingAppointments, setLoadingAppointments] = React.useState(false)
  const [appointmentError, setAppointmentError] = React.useState<string | null>(null)
  const [loadingTasks, setLoadingTasks] = React.useState(false)
  const [taskError, setTaskError] = React.useState<string | null>(null)

  React.useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [])

  React.useEffect(() => {
    if (!selected) return

    const date = dateKeyLocal(selected)
    const monthKey = monthKeyLocal(month)
    let cancelled = false
    setLoadingAppointments(true)
    setAppointmentError(null)

    fetch(
      `/api/internal/service-appointments?date=${encodeURIComponent(date)}&month=${encodeURIComponent(monthKey)}`,
    )
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as {
          appointments?: ServiceAppointmentRow[]
          error?: string | null
          monthJobCounts?: { count: number; date: string }[]
        }
        if (cancelled) return
        if (body.error) {
          setAppointmentError(body.error)
          setAppointments([])
          setMonthAppointmentCounts({})
          return
        }
        setAppointments(Array.isArray(body.appointments) ? body.appointments : [])
        const counts: Record<string, number> = {}
        for (const item of body.monthJobCounts ?? []) {
          counts[item.date] = item.count
        }
        setMonthAppointmentCounts(counts)
      })
      .catch(() => {
        if (!cancelled) {
          setAppointmentError('Could not load scheduled jobs.')
          setAppointments([])
          setMonthAppointmentCounts({})
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingAppointments(false)
      })

    return () => {
      cancelled = true
    }
  }, [month, selected])

  React.useEffect(() => {
    if (!hubSpotOpsEnabled || !selected) {
      setTasks([])
      setTaskError(null)
      setLoadingTasks(false)
      return
    }

    const date = dateKeyLocal(selected)
    let cancelled = false
    setLoadingTasks(true)
    setTaskError(null)

    fetch(`/api/internal/hubspot/tasks?date=${encodeURIComponent(date)}`)
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string | null
          tasks?: HubSpotTaskRow[]
        }
        if (cancelled) return
        setTasks(Array.isArray(body.tasks) ? body.tasks : [])
        if (body.error) setTaskError(body.error)
      })
      .catch(() => {
        if (!cancelled) {
          setTaskError('Could not load HubSpot tasks.')
          setTasks([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingTasks(false)
      })

    return () => {
      cancelled = true
    }
  }, [hubSpotOpsEnabled, selected])

  const jobDays = React.useMemo(
    () => Object.keys(monthAppointmentCounts).map((key) => new Date(`${key}T12:00:00`)),
    [monthAppointmentCounts],
  )

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,auto)_minmax(0,1fr)] lg:items-start">
      <div className="min-w-0">
        <Calendar
          mode="single"
          month={month}
          onMonthChange={setMonth}
          selected={selected}
          onSelect={setSelected}
          timeZone={timeZone}
          modifiers={{
            hasJobs: jobDays,
          }}
          modifiersClassNames={{
            hasJobs: 'rdp-day_has-rhythm',
          }}
          className="w-full min-w-0 sm:w-fit"
        />
      </div>

      <div className="min-w-0 space-y-3">
        <div>
          <p className="text-sm font-medium">Day plan</p>
          <p className="text-muted-foreground text-xs">
            {selected
              ? selected.toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Pick a date'}
          </p>
        </div>

        {loadingAppointments ? <p className="text-muted-foreground text-sm">Loading scheduled jobs...</p> : null}
        {appointmentError ? <p className="text-destructive text-sm">{appointmentError}</p> : null}
        {!loadingAppointments && !appointmentError && appointments.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Scheduled jobs</p>
            <ul className="space-y-2">
              {appointments.map((appointment) => (
                <li key={appointment.id}>
                  <div className="rounded-lg border bg-card/60 px-3 py-2">
                    <p className="text-sm font-medium leading-snug">{appointment.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {[appointment.customerName, sentenceCase(appointment.status), sentenceCase(appointment.arrivalWindow)]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {!loadingAppointments && !appointmentError && appointments.length === 0 && selected && isWeekend(selected) ? (
          <p className="text-muted-foreground text-sm leading-relaxed">{weekendOpsMessage}</p>
        ) : !loadingAppointments && !appointmentError && appointments.length === 0 && selected ? (
          <div className="rounded-lg border border-dashed bg-muted/30 px-3 py-4 text-sm text-muted-foreground">
            No scheduled jobs are assigned to this date yet.
          </div>
        ) : null}

        {hubSpotOpsEnabled ? (
          <>
            <div className="pt-2">
              <p className="text-sm font-medium">CRM tasks</p>
            </div>
            {loadingTasks ? <p className="text-muted-foreground text-sm">Loading HubSpot tasks...</p> : null}
            {taskError ? <p className="text-destructive text-sm">{taskError}</p> : null}
            {!loadingTasks && !taskError && tasks.length === 0 ? (
              <p className="text-muted-foreground text-sm leading-relaxed">
                No HubSpot tasks with a due timestamp in this calendar day.
              </p>
            ) : null}
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li key={task.id}>
                  <div className="flex items-start gap-2 rounded-lg border bg-card/60 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">{task.subject}</p>
                      <p className="text-muted-foreground text-xs">
                        {[task.status, task.ownerName?.trim() || (task.ownerId ? `Owner ${task.ownerId}` : null)]
                          .filter(Boolean)
                          .join(' • ') || 'HubSpot task'}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  )
}
