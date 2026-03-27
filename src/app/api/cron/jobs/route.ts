import config from '@payload-config'
import { getPayload } from 'payload'

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false

  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${secret}`
}

async function runJobs(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })

  await payload.jobs.handleSchedules({
    allQueues: true,
  })

  const result = await payload.jobs.run({
    allQueues: true,
    limit: 50,
    overrideAccess: true,
    silent: true,
  })

  return Response.json({
    ran: true,
    result,
  })
}

export async function GET(request: Request) {
  return runJobs(request)
}

export async function POST(request: Request) {
  return runJobs(request)
}
