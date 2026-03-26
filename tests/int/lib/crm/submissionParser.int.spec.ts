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
  })
})
