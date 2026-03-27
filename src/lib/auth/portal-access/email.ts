import type { Payload } from 'payload'

import { createPortalAccessLink } from '@/lib/auth/portal-access/link'

type SendPortalAccessEmailArgs = {
  accountName?: null | string
  email: string
  mode: 'claim' | 'invite'
  name?: null | string
  nextPath?: string
  payload: Payload
  token: string
}

function emailBody(args: SendPortalAccessEmailArgs) {
  const recipientName = args.name?.trim() || 'there'
  const link = createPortalAccessLink(args)
  const subject =
    args.mode === 'invite'
      ? `Join ${args.accountName || 'your Grime Time account'}`
      : 'Claim your Grime Time account'
  const actionLine =
    args.mode === 'invite'
      ? `You were invited to join ${args.accountName || 'a Grime Time company account'}.`
      : 'A Grime Time customer record already exists for your email. Claim it to review estimates, invoices, and service details.'

  const html = `
    <p>Hi ${recipientName},</p>
    <p>${actionLine}</p>
    <p><a href="${link}">Open your secure account link</a></p>
    <p>This link expires in 72 hours. If it expires, request a fresh one from the login screen.</p>
    <p>Grime Time</p>
  `

  const text = [
    `Hi ${recipientName},`,
    '',
    actionLine,
    '',
    `Open your secure account link: ${link}`,
    '',
    'This link expires in 72 hours. If it expires, request a fresh one from the login screen.',
    '',
    'Grime Time',
  ].join('\n')

  return {
    html,
    subject,
    text,
  }
}

export async function sendPortalAccessEmail(args: SendPortalAccessEmailArgs): Promise<void> {
  const body = emailBody(args)

  await args.payload.sendEmail({
    html: body.html,
    subject: body.subject,
    text: body.text,
    to: args.email,
  })
}
