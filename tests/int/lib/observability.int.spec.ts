import { describe, expect, it } from 'vitest'

import { sanitizeAnalyticsPageEvent } from '@/lib/analytics'
import {
  createRequestTrace,
  summarizeCopilotRequest,
  summarizeInstantQuoteRequest,
  withRequestIdHeader,
} from '@/lib/observability'

describe('observability helpers', () => {
  it('sanitizes analytics urls and drops internal routes', () => {
    expect(
      sanitizeAnalyticsPageEvent({
        name: 'pageview',
        url: 'https://grimetime.test/services/house-wash?email=ops%40grimetime.app#hero',
      }),
    ).toEqual({
      name: 'pageview',
      url: 'https://grimetime.test/services/house-wash',
    })

    expect(
      sanitizeAnalyticsPageEvent({
        url: 'https://grimetime.test/portal/dashboard?tab=billing',
      }),
    ).toBeNull()
  })

  it('uses an incoming request id and attaches it to responses', () => {
    const trace = createRequestTrace(
      new Request('https://grimetime.test/api/lead-forms/contact', {
        headers: {
          'x-request-id': 'req-test-123',
        },
        method: 'POST',
      }),
      'lead-forms.contact',
    )

    const response = withRequestIdHeader(new Response(null, { status: 204 }), trace.requestId)

    expect(trace.requestId).toBe('req-test-123')
    expect(response.headers.get('x-request-id')).toBe('req-test-123')
  })

  it('summarizes requests without carrying raw query or scheduling note text', () => {
    const quoteSummary = summarizeInstantQuoteRequest({
      address: '100 River Rd',
      condition: 'standard',
      details: 'Need service before guests arrive.',
      frequency: 'one_time',
      phone: '555-0101',
      requestScheduling: true,
      scheduleApproximateSize: 'Large patio',
      schedulingNotes: 'Gate code 1234',
      schedulingPreferredWindow: 'morning',
      schedulingPropertyType: 'residential',
      serviceKey: 'house-wash',
      sqft: '1850',
      stories: '2',
    })
    const copilotSummary = summarizeCopilotRequest({
      currentPath: '/ops/workspace',
      focusedSession: { mode: 'image' },
      messages: [
        { content: 'Earlier assistant reply', role: 'assistant' },
        { content: 'Call Mike at 555-0101 about the dock quote', role: 'user' },
      ],
    })

    expect(quoteSummary).toMatchObject({
      hasAddress: true,
      hasDetails: true,
      hasSchedulingNotes: true,
      requestScheduling: true,
      sqftBucket: '1000-2499',
    })
    expect(JSON.stringify(quoteSummary)).not.toContain('Gate code 1234')
    expect(copilotSummary).toEqual({
      currentPath: '/ops/workspace',
      focusedSessionMode: 'image',
      hasAuthoringContext: false,
      latestUserQueryLength: 42,
      messageCount: 2,
    })
    expect(JSON.stringify(copilotSummary)).not.toContain('555-0101')
  })
})
