import type { Media } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

type AboutArgs = {
  heroImage: Media
  supportImage: Media
}

type LexicalChild = {
  type: string
  version: number
  [key: string]: unknown
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

export const about = ({ heroImage, supportImage }: AboutArgs): RequiredDataFromCollectionSlug<'pages'> => {
  return {
    slug: 'about',
    _status: 'published',
    hero: {
      type: 'mediumImpact',
      media: heroImage.id,
      links: [
        {
          link: {
            type: 'custom',
            appearance: 'default',
            label: 'Start estimate',
            url: '/#instant-quote',
          },
        },
        {
          link: {
            type: 'custom',
            appearance: 'outline',
            label: 'Book online',
            url: '/schedule',
          },
        },
      ],
      richText: {
        root: root([
          heading('h1', 'Exterior cleaning built by young operators who wanted real reps early.'),
          paragraph(
            'Grime Time started with simple jobs, a willingness to learn fast, and the belief that real-world experience before college would make formal education more valuable, not less.',
          ),
        ]),
      },
    },
    layout: [
      {
        blockType: 'content',
        columns: [
          {
            size: 'full',
            enableLink: false,
            richText: {
              root: root([
                heading('h2', 'Why we started'),
                paragraph(
                  'The company was founded by two young entrepreneurs building something serious while they plan for college. They wanted to get ahead of a formalized education by learning how to sell, serve customers, estimate work, operate equipment, and carry responsibility in the real world first.',
                ),
                paragraph(
                  'That mindset still drives the business: take straightforward service work, then build something more formidable with better systems, cleaner branding, tighter estimating, and stronger customer communication.',
                ),
              ]),
            },
          },
        ],
      },
      {
        blockType: 'mediaBlock',
        media: supportImage.id,
      },
      {
        blockType: 'content',
        columns: [
          {
            size: 'half',
            enableLink: false,
            richText: {
              root: root([
                heading('h3', 'What customers get'),
                paragraph(
                  'Customers get a team that is hungry, detail-oriented, and serious about communication. We are not trying to fake a giant company image. We are building the company by doing the work well, being honest about scope, and improving every season.',
                ),
              ]),
            },
          },
          {
            size: 'half',
            enableLink: false,
            richText: {
              root: root([
                heading('h3', 'Where we are going'),
                paragraph(
                  'Residential exterior cleaning is the base: house washing, driveways, porches, and docks. The long-term goal is to grow into a dependable commercial operation with stronger systems, repeat work, monthly invoicing, and a business that keeps compounding while the founders keep learning.',
                ),
              ]),
            },
          },
        ],
      },
      {
        blockType: 'cta',
        links: [
          {
            link: {
              type: 'custom',
              appearance: 'default',
              label: 'Start estimate',
              url: '/#instant-quote',
            },
          },
          {
            link: {
              type: 'custom',
              appearance: 'outline',
              label: 'Book online',
              url: '/schedule',
            },
          },
        ],
        richText: {
          root: root([
            heading('h3', 'See how we scope the work.'),
            paragraph(
              'If you want to know what the property might cost, start with the instant estimate and we will turn it into a real next step.',
            ),
          ]),
        },
      },
    ],
    meta: {
      title: 'About Grime Time',
      description:
        'Learn how Grime Time was founded by two young entrepreneurs building real-world experience ahead of college while growing an exterior cleaning business the right way.',
    },
    title: 'About',
  }
}
