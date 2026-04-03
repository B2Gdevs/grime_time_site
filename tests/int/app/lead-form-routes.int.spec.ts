import { describe, expect, it, vi } from 'vitest'

vi.mock('payload', () => ({
  getPayload: vi.fn(),
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

describe('lead form route observability', () => {
  it('returns the request id header on contact validation failures', async () => {
    const { POST } = await import('@/app/api/lead-forms/contact/route')
    const response = await POST(
      new Request('http://localhost/api/lead-forms/contact', {
        body: JSON.stringify({}),
        headers: {
          'content-type': 'application/json',
          'x-request-id': 'req-contact-400',
        },
        method: 'POST',
      }),
    )

    expect(response.status).toBe(400)
    expect(response.headers.get('x-request-id')).toBe('req-contact-400')
  })
})
