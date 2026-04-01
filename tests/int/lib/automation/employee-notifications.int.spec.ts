import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { sendEmployeeNotification } from '@/lib/automation/employee-notifications/sendEmployeeNotification'

describe('employee notifications', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('sends inbound instant-quote alerts to the lead owner and shared inboxes', async () => {
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'http://127.0.0.1:5465')
    vi.stubEnv('RESEND_API_KEY', 're_test_key')
    vi.stubEnv('EMPLOYEE_NOTIFICATION_EMAILS', 'ops@grimetime.app,quotes@grimetime.app')

    const sendEmail = vi.fn(async () => undefined)
    const create = vi.fn(async () => ({ id: 91 }))
    const findByID = vi.fn(async () => ({
      id: 42,
      title: 'Jamie - house wash',
      customerEmail: 'jamie@example.com',
      customerName: 'Jamie',
      customerPhone: '555-0101',
      nextActionAt: '2026-04-02T12:00:00.000Z',
      notes: 'Customer wants the quote today.',
      owner: { id: 7, email: 'owner@grimetime.app', name: 'Owner' },
      priority: 'high',
      serviceAddress: { street1: '123 Oak St' },
      serviceSummary: 'House wash',
      source: 'instant_quote',
    }))

    await sendEmployeeNotification(
      {
        create,
        findByID,
        sendEmail,
      } as never,
      {
        leadId: 42,
        type: 'lead_created',
      },
    )

    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('New instant quote request'),
        to: ['owner@grimetime.app', 'ops@grimetime.app', 'quotes@grimetime.app'],
      }),
    )
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'crm-activities',
        data: expect.objectContaining({
          lead: 42,
          title: 'Employee lead alert: Jamie - house wash sent',
        }),
      }),
    )
  })

  it('falls back to an internal activity when email delivery is not configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'http://127.0.0.1:5465')
    vi.stubEnv('RESEND_API_KEY', '')
    vi.stubEnv('EMPLOYEE_NOTIFICATION_EMAILS', '')

    const sendEmail = vi.fn(async () => undefined)
    const create = vi.fn(async () => ({ id: 92 }))
    const find = vi.fn(async () => ({
      docs: [{ email: 'admin@grimetime.app', id: 3, roles: ['admin'] }],
    }))
    const findByID = vi.fn(async () => ({
      id: 99,
      title: 'Taylor - general question',
      customerEmail: 'taylor@example.com',
      customerName: 'Taylor',
      customerPhone: null,
      nextActionAt: null,
      notes: 'Needs call back tomorrow.',
      owner: null,
      priority: 'medium',
      serviceAddress: { street1: '55 Main St' },
      serviceSummary: 'General question',
      source: 'contact_request',
    }))

    await sendEmployeeNotification(
      {
        create,
        find,
        findByID,
        sendEmail,
      } as never,
      {
        leadId: 99,
        type: 'lead_created',
      },
    )

    expect(sendEmail).not.toHaveBeenCalled()
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'crm-activities',
        data: expect.objectContaining({
          lead: 99,
          title: 'Employee lead alert: Taylor - general question skipped (email disabled)',
        }),
      }),
    )
  })
})
