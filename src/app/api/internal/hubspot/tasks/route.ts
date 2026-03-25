import { requireAdminPayload } from '@/lib/auth/requireAdminPayload'
import { hubSpotTasksDueInRange } from '@/lib/hubspot/opsClient'

function localDayBoundsMs(dateStr: string): { fromMs: number; toMs: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  const start = new Date(y, mo, d, 0, 0, 0, 0)
  const end = new Date(y, mo, d, 23, 59, 59, 999)
  if (Number.isNaN(start.getTime())) return null
  return { fromMs: start.getTime(), toMs: end.getTime() }
}

export async function GET(request: Request) {
  const payload = await requireAdminPayload(request)

  if (!payload) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const date = url.searchParams.get('date')?.trim() ?? ''

  const bounds = localDayBoundsMs(date)
  if (!bounds) {
    return Response.json({ error: 'Invalid or missing date=YYYY-MM-DD' }, { status: 400 })
  }

  try {
    const { tasks, error } = await hubSpotTasksDueInRange(bounds.fromMs, bounds.toMs)
    return Response.json({ tasks, error: error ?? null, checkedAt: new Date().toISOString() })
  } catch (e) {
    return Response.json(
      {
        tasks: [],
        error: e instanceof Error ? e.message : 'HubSpot tasks request failed',
        checkedAt: new Date().toISOString(),
      },
      { status: 200 },
    )
  }
}
