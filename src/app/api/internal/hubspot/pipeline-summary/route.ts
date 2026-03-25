import { requireAdminPayload } from '@/lib/auth/requireAdminPayload'
import { hubSpotOpenPipelineSummary } from '@/lib/hubspot/opsClient'

export async function GET(request: Request) {
  const payload = await requireAdminPayload(request)

  if (!payload) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { summary, error } = await hubSpotOpenPipelineSummary()
    return Response.json({
      summary,
      error: error ?? null,
      checkedAt: new Date().toISOString(),
    })
  } catch (e) {
    return Response.json({
      summary: null,
      error: e instanceof Error ? e.message : 'HubSpot pipeline request failed',
      checkedAt: new Date().toISOString(),
    })
  }
}
