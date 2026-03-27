import { describe, expect, it } from 'vitest'

import { parseSubmissionRows } from '@/lib/crm/internal/submissionParser'

describe('parseSubmissionRows', () => {
  it('classifies instant quote submissions as high-priority residential opportunities', () => {
    const parsed = parseSubmissionRows([
      { field: 'fullName', value: 'Jamie Customer' },
      { field: 'email', value: 'jamie@example.com' },
      { field: 'serviceType', value: 'House wash' },
      { field: 'propertyAddress', value: '123 Oak St' },
      { field: 'leadSource', value: 'instant_quote' },
    ])

    expect(parsed).toMatchObject({
      accountType: 'residential',
      customerEmail: 'jamie@example.com',
      customerName: 'Jamie Customer',
      priority: 'high',
      requestKind: 'sales',
      shouldCreateOpportunity: true,
      source: 'instant_quote',
      staleDays: 1,
    })
  })

  it('classifies instant quote + scheduling as scheduling support while keeping instant_quote source', () => {
    const parsed = parseSubmissionRows([
      { field: 'fullName', value: 'Jamie Customer' },
      { field: 'email', value: 'jamie@example.com' },
      { field: 'serviceType', value: 'House wash' },
      { field: 'propertyAddress', value: '123 Oak St' },
      { field: 'schedulingRequested', value: 'Yes' },
      { field: 'propertyType', value: 'Residential' },
      { field: 'preferredWindow', value: 'Morning preferred' },
      { field: 'leadSource', value: 'instant_quote' },
    ])

    expect(parsed).toMatchObject({
      accountType: 'residential',
      priority: 'high',
      requestKind: 'scheduling_support',
      shouldCreateOpportunity: true,
      source: 'instant_quote',
      staleDays: 1,
    })
  })

  it('classifies commercial walkthrough requests as commercial opportunities', () => {
    const parsed = parseSubmissionRows([
      { field: 'fullName', value: 'Taylor Ops' },
      { field: 'email', value: 'taylor@example.com' },
      { field: 'serviceType', value: 'Commercial walkthrough' },
      { field: 'propertyType', value: 'Commercial' },
      { field: 'leadSource', value: 'schedule_request' },
    ])

    expect(parsed).toMatchObject({
      accountType: 'commercial',
      priority: 'high',
      requestKind: 'scheduling_support',
      shouldCreateOpportunity: true,
      source: 'schedule_request',
      staleDays: 1,
    })
  })

  it('keeps policy-style contact requests out of opportunity creation', () => {
    const parsed = parseSubmissionRows([
      { field: 'fullName', value: 'Jordan' },
      { field: 'email', value: 'jordan@example.com' },
      { field: 'serviceType', value: 'Privacy or data request' },
      { field: 'leadSource', value: 'contact_request' },
    ])

    expect(parsed.shouldCreateOpportunity).toBe(false)
    expect(parsed.priority).toBe('medium')
    expect(parsed.accountType).toBe('residential')
    expect(parsed.requestKind).toBe('policy_privacy')
  })

  it('routes billing or refund requests into the support class instead of sales', () => {
    const parsed = parseSubmissionRows([
      { field: 'fullName', value: 'Billing Contact' },
      { field: 'email', value: 'billing@example.com' },
      { field: 'serviceType', value: 'Billing or refund question' },
      { field: 'message', value: 'Customer asked for a refund because of a service issue.' },
      { field: 'leadSource', value: 'contact_request' },
    ])

    expect(parsed.requestKind).toBe('refund_request')
    expect(parsed.shouldCreateOpportunity).toBe(false)
  })
})
