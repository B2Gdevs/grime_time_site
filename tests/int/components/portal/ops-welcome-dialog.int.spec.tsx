import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const refresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh,
  }),
}))

describe('OpsWelcomeDialog', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    refresh.mockReset()
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ ok: true }),
      ok: true,
    }) as typeof fetch
  })

  it('stores dismissal when continuing', async () => {
    const { OpsWelcomeDialog } = await import('@/components/portal/OpsWelcomeDialog')

    render(<OpsWelcomeDialog openInitially userName="Casey" />)

    expect(screen.getByText('Welcome to ops, Casey')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Continue to ops' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/internal/ops/welcome', {
        method: 'POST',
      })
    })
    await waitFor(() => {
      expect(refresh).toHaveBeenCalled()
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })
})
