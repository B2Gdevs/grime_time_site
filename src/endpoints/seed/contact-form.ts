import { RequiredDataFromCollectionSlug } from 'payload'

const contactFormBase: RequiredDataFromCollectionSlug<'forms'> = {
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
              text: 'The contact form has been submitted successfully.',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          tag: 'h2',
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  },
  confirmationType: 'message',
  createdAt: '2023-01-12T21:47:41.374Z',
  emails: [
    {
      emailFrom: '"Grime Time" \u003Conboarding@resend.dev\u003E',
      emailTo: '{{email}}',
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
                  text: 'Your contact form submission was successfully received.',
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
      subject: "You've received a new message.",
    },
  ],
  fields: [
    {
      name: 'full-name',
      blockName: 'full-name',
      blockType: 'text',
      label: 'Full Name',
      required: true,
      width: 100,
    },
    {
      name: 'email',
      blockName: 'email',
      blockType: 'email',
      label: 'Email',
      required: true,
      width: 100,
    },
    {
      name: 'phone',
      blockName: 'phone',
      blockType: 'text',
      label: 'Phone',
      required: false,
      width: 100,
    },
    {
      name: 'message',
      blockName: 'message',
      blockType: 'textarea',
      label: 'Message',
      required: true,
      width: 100,
    },
  ],
  redirect: undefined,
  submitButtonLabel: 'Submit',
  title: 'Contact Form',
  updatedAt: '2023-01-12T21:47:41.374Z',
}

/** Uses `EMAIL_FROM` when set (must match a verified sender in Resend). */
export function buildContactFormData(): RequiredDataFromCollectionSlug<'forms'> {
  const addr = process.env.EMAIL_FROM?.trim()
  const emailFrom = addr ? `"Grime Time" <${addr}>` : contactFormBase.emails?.[0]?.emailFrom
  const emails = contactFormBase.emails?.length
    ? [{ ...contactFormBase.emails[0], emailFrom: emailFrom || contactFormBase.emails[0].emailFrom }]
    : contactFormBase.emails
  return {
    ...contactFormBase,
    emails,
  }
}

export const contactForm = contactFormBase
