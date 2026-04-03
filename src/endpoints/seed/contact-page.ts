import type { Media } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

type ContactArgs = {
  heroImage: Media
}

/** CMS `pages` document for `/contact` — hero + first-party contact block (lead-forms API). */
export const contact: (args: ContactArgs) => RequiredDataFromCollectionSlug<'pages'> = ({
  heroImage,
}) => {
  return {
    slug: 'contact',
    _status: 'published',
    visibility: 'public',
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
            url: '/#instant-quote',
          },
        },
      ],
      richText: {
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
                  text: 'Reach the team without turning everything into a quote.',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              tag: 'h1',
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
                  text: 'Support, billing, refunds, privacy, policy, scheduling, or service follow-up—we log the request and reply with a real next step.',
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
    layout: [
      {
        blockType: 'contactRequest',
        layoutVariant: 'default',
      },
    ],
    title: 'Contact',
  }
}
