import { requireAdminPayload } from '@/lib/auth/requireAdminPayload'
import { hubSpotHealthCheck } from '@/lib/hubspot/opsClient'

export async function GET(request: Request) {
  const payload = await requireAdminPayload(request)

  if (!payload) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await hubSpotHealthCheck()
  const checkedAt = new Date().toISOString()

  if (result.ok) {
    return Response.json({ ok: true, checkedAt })
  }

  return Response.json({
    ok: false,
    checkedAt,
    message: result.message,
    status: 'status' in result ? result.status : undefined,
  })
}
