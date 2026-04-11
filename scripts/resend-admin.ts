import 'dotenv/config'

import { Resend } from 'resend'
import type { WebhookEvent } from 'resend'

type Command = 'domain:enable-receiving' | 'domain:status' | 'send:inbound-test' | 'webhook:list' | 'webhook:sync'

function getArg(name: string) {
  const prefix = `--${name}=`
  const value = process.argv.find((arg) => arg.startsWith(prefix))
  return value ? value.slice(prefix.length).trim() : null
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

async function resolveDomainId(resend: Resend, requestedNameOrId?: null | string) {
  if (requestedNameOrId && requestedNameOrId.includes('-')) {
    return requestedNameOrId
  }

  const targetName = requestedNameOrId || process.env.RESEND_DOMAIN_NAME?.trim() || 'grimetime.app'
  const { data, error } = await resend.domains.list()

  if (error || !data) {
    throw new Error(error?.message || 'Could not list Resend domains.')
  }

  const match = data.data.find((domain) => domain.name === targetName)

  if (!match) {
    throw new Error(`Could not find Resend domain named ${targetName}.`)
  }

  return match.id
}

async function resolveWebhookId(resend: Resend, requestedId?: null | string) {
  const directId = requestedId || process.env.RESEND_WEBHOOK_ID?.trim()

  if (directId) {
    return directId
  }

  const endpoint =
    process.env.RESEND_WEBHOOK_ENDPOINT?.trim() || 'https://grimetime.app/api/resend/webhook'
  const { data, error } = await resend.webhooks.list()

  if (error || !data) {
    throw new Error(error?.message || 'Could not list Resend webhooks.')
  }

  const match = data.data.find((hook) => hook.endpoint === endpoint)

  if (!match) {
    throw new Error(`Could not find a Resend webhook for ${endpoint}.`)
  }

  return match.id
}

async function listWebhooks(resend: Resend) {
  const { data, error } = await resend.webhooks.list()

  if (error || !data) {
    throw new Error(error?.message || 'Could not list Resend webhooks.')
  }

  console.log(
    JSON.stringify(
      data.data.map((hook) => ({
        endpoint: hook.endpoint,
        events: hook.events,
        id: hook.id,
        status: hook.status,
      })),
      null,
      2,
    ),
  )
}

async function syncWebhook(resend: Resend) {
  const webhookId = await resolveWebhookId(resend, getArg('id'))
  const endpoint =
    getArg('endpoint') || process.env.RESEND_WEBHOOK_ENDPOINT?.trim() || 'https://grimetime.app/api/resend/webhook'
  const events = (getArg('events') || 'email.received')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean) as WebhookEvent[]

  const { data, error } = await resend.webhooks.update(webhookId, {
    endpoint,
    events,
    status: 'enabled',
  })

  if (error || !data) {
    throw new Error(error?.message || 'Could not update the Resend webhook.')
  }

  const current = await resend.webhooks.get(webhookId)

  if (current.error || !current.data) {
    throw new Error(current.error?.message || 'Could not reload the Resend webhook.')
  }

  console.log(
    JSON.stringify(
      {
        endpoint: current.data.endpoint,
        events: current.data.events,
        id: current.data.id,
        signingSecret: current.data.signing_secret,
        status: current.data.status,
      },
      null,
      2,
    ),
  )
}

async function printDomainStatus(resend: Resend) {
  const domainId = await resolveDomainId(resend, getArg('domain'))
  const { data, error } = await resend.domains.get(domainId)

  if (error || !data) {
    throw new Error(error?.message || 'Could not load the Resend domain.')
  }

  console.log(
    JSON.stringify(
      {
        capabilities: data.capabilities,
        id: data.id,
        name: data.name,
        records: data.records,
        status: data.status,
      },
      null,
      2,
    ),
  )
}

async function enableReceiving(resend: Resend) {
  const domainId = await resolveDomainId(resend, getArg('domain'))
  const update = await resend.domains.update({
    capabilities: {
      receiving: 'enabled',
    },
    id: domainId,
  })

  if (update.error || !update.data) {
    throw new Error(update.error?.message || 'Could not enable Resend receiving.')
  }

  await printDomainStatus(resend)
}

async function sendInboundTest(resend: Resend) {
  const to = getArg('to') || process.env.INBOUND_MEDIA_EMAIL?.trim()

  if (!to) {
    throw new Error('Missing inbound recipient. Set INBOUND_MEDIA_EMAIL or pass --to=media@grimetime.app')
  }

  const from = process.env.EMAIL_FROM?.trim()

  if (!from) {
    throw new Error('Missing EMAIL_FROM for the outbound test message.')
  }

  const subject = getArg('subject') || 'Grime Time inbound media test'
  const body = getArg('text') || 'Inbound media webhook test from the Grime Time repo script.'
  const attachments = [
    {
      content: Buffer.from('grime-time-inbound-test-image').toString('base64'),
      contentType: 'image/png',
      filename: 'grime-time-test.png',
    },
  ]

  const { data, error } = await resend.emails.send({
    attachments,
    from,
    subject,
    text: body,
    to,
  })

  if (error || !data) {
    throw new Error(error?.message || 'Could not send the inbound test email.')
  }

  console.log(JSON.stringify({ id: data.id, to }, null, 2))
}

async function main() {
  const apiKey = requireEnv('RESEND_API_KEY')
  const command = process.argv[2] as Command | undefined

  if (!command) {
    throw new Error(
      'Missing command. Use one of: webhook:list, webhook:sync, domain:status, domain:enable-receiving, send:inbound-test',
    )
  }

  const resend = new Resend(apiKey)

  switch (command) {
    case 'webhook:list':
      await listWebhooks(resend)
      return
    case 'webhook:sync':
      await syncWebhook(resend)
      return
    case 'domain:status':
      await printDomainStatus(resend)
      return
    case 'domain:enable-receiving':
      await enableReceiving(resend)
      return
    case 'send:inbound-test':
      await sendInboundTest(resend)
      return
    default:
      throw new Error(`Unsupported command: ${command satisfies never}`)
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
