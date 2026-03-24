import { RequiredDataFromCollectionSlug } from 'payload'

export const SEED_INSTANT_QUOTE_FORM_TITLE = 'Instant Quote Form'

const instantQuoteFormBase: RequiredDataFromCollectionSlug<'forms'> = {
  title: SEED_INSTANT_QUOTE_FORM_TITLE,
  submitButtonLabel: 'Send estimate request',
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
              text: 'Your estimate request is in.',
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
              text: 'We saved your details and will follow up with a scoped quote after we review the property information.',
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
      subject: 'We got your instant quote request',
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
                  text: 'Thanks for requesting a quote. We will review the job details and follow up with a scoped estimate.',
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
    { name: 'phone', blockType: 'text', label: 'Phone', width: 100 },
    { name: 'serviceType', blockType: 'text', label: 'Service type', width: 100 },
    { name: 'propertyAddress', blockType: 'text', label: 'Property address', width: 100 },
    { name: 'serviceAreaSqft', blockType: 'text', label: 'Approx. square footage', width: 100 },
    { name: 'stories', blockType: 'text', label: 'Stories', width: 100 },
    { name: 'condition', blockType: 'text', label: 'Condition', width: 100 },
    { name: 'frequency', blockType: 'text', label: 'Frequency', width: 100 },
    { name: 'estimatedRange', blockType: 'text', label: 'Estimated range', width: 100 },
    { name: 'details', blockType: 'textarea', label: 'Details', width: 100 },
  ],
}

export function buildInstantQuoteFormData(): RequiredDataFromCollectionSlug<'forms'> {
  const addr = process.env.EMAIL_FROM?.trim()
  const emailFrom = addr ? `"Grime Time" <${addr}>` : instantQuoteFormBase.emails?.[0]?.emailFrom
  const emails = instantQuoteFormBase.emails?.length
    ? [{ ...instantQuoteFormBase.emails[0], emailFrom: emailFrom || instantQuoteFormBase.emails[0].emailFrom }]
    : instantQuoteFormBase.emails

  return {
    ...instantQuoteFormBase,
    emails,
  }
}
