import { beforeEach, describe, expect, it, vi } from 'vitest'

const getPayload = vi.fn()
const isClerkServerConfigured = vi.fn()
const getSupabaseServerClient = vi.fn()

vi.mock('payload', () => ({
  getPayload,
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

vi.mock('@/lib/clerk/config', () => ({
  isClerkClientConfigured: vi.fn(() => true),
  isClerkServerConfigured,
}))

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient,
}))

vi.mock('@/utilities/getURL', () => ({
  getServerSideURL: () => 'http://localhost:5465',
}))

describe('customer auth fallback routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isClerkServerConfigured.mockReturnValue(true)
  })

  it('blocks legacy registration when Clerk is primary', async () => {
    const { POST } = await import('@/app/auth/register/route')
    const response = await POST(
      new Request('http://localhost:5465/auth/register', {
        body: JSON.stringify({
          email: 'crew@example.com',
          name: 'Crew Lead',
          password: 'password-123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }),
    )

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining('hosted Grime Time sign-in flow'),
    })
    expect(getPayload).not.toHaveBeenCalled()
  })

  it('redirects legacy Supabase confirmation links back into the Clerk claim flow', async () => {
    const { GET } = await import('@/app/auth/confirm/route')
    const response = await GET(
      new Request(
        'http://localhost:5465/auth/confirm?claim=invite-token&next=%2Faccount&code=legacy-code',
      ),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:5465/claim-account?claim=invite-token&next=%2Faccount',
    )
    expect(getSupabaseServerClient).not.toHaveBeenCalled()
  })

  it('redirects other legacy Supabase confirmation links to hosted sign-in when Clerk is primary', async () => {
    const { GET } = await import('@/app/auth/confirm/route')
    const response = await GET(
      new Request('http://localhost:5465/auth/confirm?token_hash=abc&type=recovery'),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:5465/login?error=clerk-auth-active',
    )
    expect(getSupabaseServerClient).not.toHaveBeenCalled()
  })
})
