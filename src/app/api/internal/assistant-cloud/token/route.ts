import { userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import { requirePayloadUser } from '@/lib/auth/requirePayloadUser'
import { createAssistantCloudServerClient, getAssistantCloudBaseUrl } from '@/lib/ai/assistantCloud'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const auth = await requirePayloadUser(request)

  if (!auth || !userIsAdmin(auth.user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!getAssistantCloudBaseUrl()) {
    return Response.json({ error: 'Assistant cloud is not configured.' }, { status: 503 })
  }

  const cloud = createAssistantCloudServerClient(String(auth.realUser.id))

  if (!cloud) {
    return Response.json({ error: 'Assistant cloud API key is not configured.' }, { status: 503 })
  }

  const { token } = await cloud.auth.tokens.create()

  return Response.json(
    { token },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )
}
