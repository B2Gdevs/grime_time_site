import { RequiredDataFromCollectionSlug } from 'payload'

type LexicalChild = {
  type: string
  version: number
  [key: string]: unknown
}

type SupportSection = {
  paragraphs: string[]
  title: string
}

const root = (children: LexicalChild[]) => ({
  type: 'root' as const,
  children,
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  version: 1,
})

const text = (value: string) => ({
  type: 'text' as const,
  detail: 0,
  format: 0,
  mode: 'normal' as const,
  style: '',
  text: value,
  version: 1,
})

const heading = (tag: 'h1' | 'h2' | 'h3', value: string) => ({
  type: 'heading' as const,
  children: [text(value)],
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  tag,
  version: 1,
})

const paragraph = (value: string) => ({
  type: 'paragraph' as const,
  children: [text(value)],
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  textFormat: 0,
  version: 1,
})

function contentBlock(title: string, paragraphs: string[]) {
  return {
    blockType: 'content' as const,
    columns: [
      {
        size: 'full' as const,
        enableLink: false,
        richText: {
          root: root([heading('h2', title), ...paragraphs.map((entry) => paragraph(entry))]),
        },
      },
    ],
  }
}

function ctaBlock(title: string, body: string) {
  return {
    blockType: 'cta' as const,
    links: [
      {
        link: {
          type: 'custom' as const,
          appearance: 'default' as const,
          label: 'Contact the team',
          url: '/contact',
        },
      },
      {
        link: {
          type: 'custom' as const,
          appearance: 'outline' as const,
          label: 'Back to home',
          url: '/',
        },
      },
    ],
    richText: {
      root: root([heading('h3', title), paragraph(body)]),
    },
  }
}

function buildSupportPage({
  ctaBody,
  heroBody,
  heroTitle,
  metaDescription,
  sections,
  slug,
  title,
}: {
  ctaBody: string
  heroBody: string
  heroTitle: string
  metaDescription: string
  sections: SupportSection[]
  slug: string
  title: string
}): RequiredDataFromCollectionSlug<'pages'> {
  return {
    slug,
    _status: 'published',
    visibility: 'public',
    hero: {
      type: 'lowImpact',
      richText: {
        root: root([heading('h1', heroTitle), paragraph(heroBody)]),
      },
    },
    layout: [
      ...sections.map((section) => contentBlock(section.title, section.paragraphs)),
      ctaBlock('Need help from the team?', ctaBody),
    ],
    meta: {
      title: `${title} | Grime Time`,
      description: metaDescription,
    },
    title,
  }
}

export const privacyPolicyPage = (): RequiredDataFromCollectionSlug<'pages'> =>
  buildSupportPage({
    slug: 'privacy-policy',
    title: 'Privacy policy',
    heroTitle: 'How Grime Time handles customer information.',
    heroBody:
      'This page explains what we collect, why we collect it, and how to contact us if you need a correction, deletion review, or a copy of the information tied to your request.',
    metaDescription:
      'Read how Grime Time handles contact information, service details, and customer follow-up records.',
    sections: [
      {
        title: 'What we collect',
        paragraphs: [
          'When you use the quote, schedule, or contact flows, we collect the details you give us such as your name, email, phone number, property address, and message.',
          'We may also keep internal notes tied to service requests, scheduling follow-up, billing questions, or customer support history so the team can respond accurately.',
        ],
      },
      {
        title: 'How we use it',
        paragraphs: [
          'We use customer information to respond to requests, prepare estimates, schedule work, send service updates, and handle support, billing, refund, or privacy questions.',
          'We do not treat a contact request like a dead-end inbox. We store it in our operating system so the team can follow up and keep a record of the conversation.',
        ],
      },
      {
        title: 'Where it is stored',
        paragraphs: [
          'Grime Time stores site submissions in Payload CMS and uses internal operational records to manage follow-up and customer relationship management.',
          'We may also rely on normal website, hosting, email, and storage vendors to operate the site and customer communication flow.',
        ],
      },
      {
        title: 'Your requests',
        paragraphs: [
          'If you need us to correct contact details, review deletion of a support request, or explain what information we still hold about your request, contact us through the main contact page and choose the privacy option.',
          'We will review each request in context. We may keep records that are still needed for scheduling, dispute review, accounting, fraud prevention, or other legitimate business operations.',
        ],
      },
      {
        title: 'Security and retention',
        paragraphs: [
          'We use reasonable administrative and technical controls for the systems we operate, but no internet workflow can promise perfect security.',
          'We keep request data as long as it is useful for customer service, business records, legal review, or normal operations, then remove or minimize it when it is no longer needed.',
        ],
      },
    ],
    ctaBody:
      'Use the contact form if you need a privacy or data-handling review. Include the email address and property details tied to the original request so we can find the right record quickly.',
  })

export const termsAndConditionsPage = (): RequiredDataFromCollectionSlug<'pages'> =>
  buildSupportPage({
    slug: 'terms-and-conditions',
    title: 'Terms and conditions',
    heroTitle: 'Service expectations before work is scheduled or completed.',
    heroBody:
      'These terms explain how estimates, scheduling, access, payment, and service concerns are handled for normal Grime Time jobs.',
    metaDescription:
      'Review the basic customer terms for estimates, scheduling, site access, and payment with Grime Time.',
    sections: [
      {
        title: 'Estimates and scope',
        paragraphs: [
          'Instant quotes and starting-price ranges are planning tools, not a final promise. Final scope depends on actual size, soil level, access, hazards, and service conditions confirmed by the team.',
          'If the property condition is materially different from the information provided, the final scope, timing, or price may need to change before work begins.',
        ],
      },
      {
        title: 'Scheduling and weather',
        paragraphs: [
          'Requested service windows are not locked until Grime Time confirms the job. Weather, safety conditions, equipment limits, and route changes may require rescheduling.',
          'If a weather or access issue affects the job, we will contact you with the next available step instead of forcing a bad service day.',
        ],
      },
      {
        title: 'Customer responsibilities',
        paragraphs: [
          'Customers should provide accurate contact information, reasonable access to the work area, and notice of any known hazards, fragile surfaces, gate codes, or utility limitations.',
          'If water access, power access, site entry, or surface conditions are materially different from what was described, Grime Time may pause the job until the scope is reviewed.',
        ],
      },
      {
        title: 'Payment and approval',
        paragraphs: [
          'Work should be approved based on the confirmed scope, not only the initial online estimate. Payment timing, invoice delivery, and any approved add-ons will be communicated during scheduling or after service.',
          'Questions about charges, service concerns, or refund review should go through the contact page so they enter the normal support workflow.',
        ],
      },
      {
        title: 'Service concerns',
        paragraphs: [
          'If you believe something was missed, contact the team promptly with the property address, service date, and a short explanation of the issue.',
          'Grime Time prefers to review the concern directly and, when appropriate, schedule a touch-up or another practical resolution before moving to a refund discussion.',
        ],
      },
    ],
    ctaBody:
      'If anything in the scope, schedule, or payment flow is unclear, send a general support request before the job date so the team can confirm expectations in writing.',
  })

export const refundPolicyPage = (): RequiredDataFromCollectionSlug<'pages'> =>
  buildSupportPage({
    slug: 'refund-policy',
    title: 'Refund policy',
    heroTitle: 'How Grime Time reviews billing and refund questions.',
    heroBody:
      'We handle refund requests through a structured review process so completed work, missed scope items, and billing concerns can be assessed fairly.',
    metaDescription:
      'Read how Grime Time handles billing questions, service re-checks, and refund reviews.',
    sections: [
      {
        title: 'Start with a service review',
        paragraphs: [
          'If a result does not look right, contact us first with the address, service date, and photos when possible. Many concerns are best resolved through a touch-up, walkthrough, or scope review instead of an immediate refund.',
          'We want the team to see the actual issue before deciding whether the correct fix is rework, adjustment, partial credit, or another remedy.',
        ],
      },
      {
        title: 'When a refund may be considered',
        paragraphs: [
          'Refund or partial refund review may be considered when the completed service materially missed the confirmed scope, a billed line item was incorrect, or the team agrees the issue cannot be reasonably corrected through another service step.',
          'Approved refunds are handled case by case after the team reviews the job notes, photos, and any follow-up communication.',
        ],
      },
      {
        title: 'What usually is not refundable',
        paragraphs: [
          'Normal estimate changes caused by actual job conditions, approved add-ons, unavoidable weather delays, or scheduling changes are not automatic grounds for a refund.',
          'Completed labor that matched the confirmed scope may not be refundable simply because the original estimate or preferred timing changed.',
        ],
      },
      {
        title: 'Review timing',
        paragraphs: [
          'We aim to acknowledge billing or refund questions within one business day and complete the first review within three business days whenever the information needed to assess the request is available.',
          'If more investigation is required, we will explain the next step instead of leaving the request without an update.',
        ],
      },
    ],
    ctaBody:
      'Choose the billing or refund option on the contact form and include the address, date of service, and a short note about what you want reviewed.',
  })

export const contactSlaPage = (): RequiredDataFromCollectionSlug<'pages'> =>
  buildSupportPage({
    slug: 'contact-sla',
    title: 'Contact SLA',
    heroTitle: 'The response standards we aim to hold ourselves to.',
    heroBody:
      'This page explains the normal reply windows for new questions, active-job issues, billing concerns, and privacy requests submitted through the site.',
    metaDescription:
      'See the normal Grime Time response windows for service questions, support, billing, and privacy requests.',
    sections: [
      {
        title: 'General contact requests',
        paragraphs: [
          'For normal questions, property notes, and non-urgent support requests submitted through the contact form, we aim to respond within one business day.',
          'If the request arrives on a weekend, holiday, or after business hours, the clock starts on the next business day.',
        ],
      },
      {
        title: 'Active jobs and near-term service issues',
        paragraphs: [
          'If your message is tied to an active job, same-day arrival issue, or a time-sensitive service concern, include that clearly in the message so the team can prioritize it.',
          'When possible, we aim to acknowledge active-job issues the same business day.',
        ],
      },
      {
        title: 'Billing, refund, and privacy requests',
        paragraphs: [
          'We aim to acknowledge billing, refund, and privacy-related requests within one business day and provide a first review or next-step update within three business days.',
          'Complex cases may take longer, but we should still keep the customer updated instead of letting the thread go silent.',
        ],
      },
      {
        title: 'How to help us respond faster',
        paragraphs: [
          'Include the property address, service date if relevant, the best reply method, and a concise explanation of what you need.',
          'Photos, gate notes, invoice references, or the original email address used on the request can reduce back-and-forth and speed up review.',
        ],
      },
    ],
    ctaBody:
      'If you have a support, billing, or privacy issue, use the contact page so the request lands in the tracked workflow instead of an unstructured message thread.',
  })
