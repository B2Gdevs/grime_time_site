import { RequiredDataFromCollectionSlug } from 'payload'

import { SCHEDULE_REQUEST_FORM_TITLE } from '@/lib/forms/scheduleRequest'

const scheduleRequestFormBase: RequiredDataFromCollectionSlug<'forms'> = {
  title: SCHEDULE_REQUEST_FORM_TITLE,
  submitButtonLabel: 'Request scheduling',
  confirmationType: 'message',
  confirmationMessage: {
    root: {
      type: 'root',
      children: [
        {
          type: 'heading',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Your scheduling request is in.',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          tag: 'h2',
          version: 1,
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'We saved your request and will follow up to confirm scope, timing, and arrival windows.',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  },
  emails: [
    {
      emailFrom: '"Grime Time" <onboarding@resend.dev>',
      emailTo: '{{email}}',
      subject: 'We got your scheduling request',
      message: {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'Thanks for requesting a schedule window. We will confirm the details shortly.',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              textFormat: 0,
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
      },
    },
  ],
  fields: [
    { name: 'fullName', blockType: 'text', label: 'Full name', required: true, width: 100 },
    { name: 'email', blockType: 'email', label: 'Email', required: true, width: 100 },
    { name: 'phone', blockType: 'text', label: 'Phone', required: true, width: 100 },
    { name: 'serviceType', blockType: 'text', label: 'Requested service', width: 100 },
    { name: 'propertyType', blockType: 'text', label: 'Property type', width: 100 },
    { name: 'propertyAddress', blockType: 'text', label: 'Service address', width: 100 },
    { name: 'preferredWindow', blockType: 'text', label: 'Preferred window', width: 100 },
    { name: 'targetDate', blockType: 'text', label: 'Preferred date', width: 100 },
    { name: 'approximateSize', blockType: 'text', label: 'Approximate size', width: 100 },
    { name: 'notes', blockType: 'textarea', label: 'Notes', width: 100 },
    { name: 'leadSource', blockType: 'text', label: 'Lead source', width: 100 },
  ],
}

export function buildScheduleRequestFormData(): RequiredDataFromCollectionSlug<'forms'> {
  const addr = process.env.EMAIL_FROM?.trim()
  const emailFrom = addr
    ? `"Grime Time" <${addr}>`
    : scheduleRequestFormBase.emails?.[0]?.emailFrom
  const emails = scheduleRequestFormBase.emails?.length
    ? [{ ...scheduleRequestFormBase.emails[0], emailFrom: emailFrom || scheduleRequestFormBase.emails[0].emailFrom }]
    : scheduleRequestFormBase.emails

  return {
    ...scheduleRequestFormBase,
    emails,
  }
}
