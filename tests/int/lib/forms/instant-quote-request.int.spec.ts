import { describe, expect, it } from 'vitest'

import {
  buildInstantQuoteEstimate,
  instantQuoteRequestSchema,
  instantQuoteRequestToSubmissionRows,
} from '@/lib/forms/instantQuoteRequest'

describe('instant quote calibration', () => {
  it('prices one-story house washes from exterior wall count', () => {
    const estimate = buildInstantQuoteEstimate({
      address: '',
      condition: 'standard',
      details: '',
      email: 'jamie@example.com',
      frequency: 'one_time',
      fullName: 'Jamie Customer',
      phone: '',
      requestScheduling: false,
      scheduleApproximateSize: '',
      schedulingNotes: '',
      schedulingPreferredWindow: 'flexible',
      schedulingPropertyType: 'residential',
      schedulingTargetDate: '',
      serviceKey: 'house_wash',
      sqft: '4',
      stories: '1',
    })

    expect(estimate).toMatchObject({
      high: 400,
      kind: 'starting-price',
      low: 400,
      manualReviewRequired: false,
    })
  })

  it('moves three-story house washes into manual review', () => {
    const estimate = buildInstantQuoteEstimate({
      address: '',
      condition: 'heavy',
      details: '',
      email: 'jamie@example.com',
      frequency: 'one_time',
      fullName: 'Jamie Customer',
      phone: '',
      requestScheduling: false,
      scheduleApproximateSize: '',
      schedulingNotes: '',
      schedulingPreferredWindow: 'flexible',
      schedulingPropertyType: 'residential',
      schedulingTargetDate: '',
      serviceKey: 'house_wash',
      sqft: '6',
      stories: '3+',
    })

    expect(estimate).toMatchObject({
      high: null,
      kind: 'manual-review',
      low: null,
      manualReviewRequired: true,
    })
  })

  it('requires at least four walls for house-wash pricing', () => {
    const result = instantQuoteRequestSchema.safeParse({
      address: '',
      condition: 'standard',
      details: '',
      email: 'jamie@example.com',
      frequency: 'one_time',
      fullName: 'Jamie Customer',
      phone: '',
      requestScheduling: false,
      scheduleApproximateSize: '',
      schedulingNotes: '',
      schedulingPreferredWindow: 'flexible',
      schedulingPropertyType: 'residential',
      schedulingTargetDate: '',
      serviceKey: 'house_wash',
      sqft: '3',
      stories: '1',
    })

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected validation to fail.')
    }

    expect(result.error.flatten().fieldErrors.sqft?.[0]).toContain('4 exterior walls')
  })

  it('stores a readable house-wash measurement and starting estimate in submission rows', () => {
    const rows = instantQuoteRequestToSubmissionRows({
      address: '123 Oak St',
      condition: 'standard',
      details: '',
      email: 'jamie@example.com',
      frequency: 'one_time',
      fullName: 'Jamie Customer',
      phone: '',
      requestScheduling: false,
      scheduleApproximateSize: '',
      schedulingNotes: '',
      schedulingPreferredWindow: 'flexible',
      schedulingPropertyType: 'residential',
      schedulingTargetDate: '',
      serviceKey: 'house_wash',
      sqft: '4',
      stories: '2',
    })

    expect(rows).toEqual(
      expect.arrayContaining([
        { field: 'serviceAreaSqft', value: '4 walls' },
        { field: 'serviceMeasureLabel', value: 'Approx. exterior wall count' },
        { field: 'estimatedRange', value: 'Starting estimate: $600' },
      ]),
    )
  })
})
