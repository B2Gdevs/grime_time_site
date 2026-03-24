import type { RequiredDataFromCollectionSlug } from 'payload'
import type { Media } from '@/payload-types'

import { buildHomeMarketingBlocks } from './home-marketing-blocks'

type HomeArgs = {
  heroImage: Media
  metaImage: Media
  /** Extra gallery images for the home layout (stock placeholders — replace in admin with real job photos). */
  galleryTop: Media
  galleryMid: Media
  galleryBottom: Media
}

export const home: (args: HomeArgs) => RequiredDataFromCollectionSlug<'pages'> = ({
  heroImage,
  metaImage,
}) => {
  return {
    slug: 'home',
    _status: 'published',
    hero: {
      type: 'highImpact',
      links: [
        {
          link: {
            type: 'custom',
            appearance: 'default',
            label: 'Book online',
            url: '/schedule',
          },
        },
        {
          link: {
            type: 'custom',
            appearance: 'outline',
            label: 'Get a quote',
            url: '/#instant-quote',
          },
        },
        {
          link: {
            type: 'custom',
            appearance: 'outline',
            label: 'Our services',
            url: '/#services',
          },
        },
      ],
      media: heroImage.id,
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
                  text: 'Grime Time Exterior Cleaning',
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
                  text: 'House washes, driveways, porches, and dock cleaning for homeowners who want a clean property without the hassle. Start with an instant estimate, then let us scope the real job before we schedule. ',
                  version: 1,
                },
                {
                  type: 'link',
                  children: [
                    {
                      type: 'text',
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                      text: 'book a visit',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  fields: {
                    linkType: 'custom',
                    newTab: false,
                    url: '/schedule',
                  },
                  format: '',
                  indent: 0,
                  version: 3,
                },
                {
                  type: 'text',
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: ' or jump to the ',
                  version: 1,
                },
                {
                  type: 'link',
                  children: [
                    {
                      type: 'text',
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                      text: 'instant quote',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  fields: {
                    linkType: 'custom',
                    newTab: false,
                    url: '/#instant-quote',
                  },
                  format: '',
                  indent: 0,
                  version: 3,
                },
                {
                  type: 'text',
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: ' section for a starting range.',
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
        blockType: 'serviceGrid',
        heading: 'What we do',
        intro:
          'Residential exterior cleaning first, with a growth path toward repeat commercial work. We quote from square footage and job conditions, then confirm the real scope before scheduling.',
        services: [
          {
            name: 'House washing',
            summary:
              'Soft washing for siding, trim, soffits, and everyday organic buildup without blasting delicate surfaces.',
          },
          {
            name: 'Driveways, walkways, and patios',
            summary:
              'Flatwork cleaning priced mostly by square footage, stain severity, and how much prep/detail work the area needs.',
          },
          {
            name: 'Porches and outdoor living areas',
            summary:
              'Front porches, steps, and mixed-surface patios where detail work matters as much as raw square footage.',
          },
          {
            name: 'Docks and waterfront surfaces',
            summary:
              'Dock cleaning and algae-heavy work with extra review for stairs, rails, access, and surface safety.',
          },
          {
            name: 'Commercial growth path',
            summary:
              'Dumpsters, service lanes, and repeat commercial flatwork are on the roadmap, but still go through custom scope review today.',
          },
        ],
      },
      {
        blockType: 'serviceGrid',
        heading: 'How our pricing works',
        intro:
          'We do not guess from a single photo. Instant quotes start with square footage, then adjust for condition, stories, access, and how often you want the service.',
        services: [
          {
            name: '1. Square footage',
            summary:
              'Most residential flatwork and house washing starts with approximate square footage so the estimate scales with the size of the job.',
          },
          {
            name: '2. Surface risk and condition',
            summary:
              'Heavy algae, oxidation, grease, delicate trim, waterfront buildup, and deep staining usually push the quote upward.',
          },
          {
            name: '3. Access and recurrence',
            summary:
              'Multi-story work, difficult setup, gates, stairs, or dock access add labor, while quarterly and maintenance plans can lower per-visit pricing.',
          },
        ],
      },
      {
        blockType: 'pricingTable',
        dataSource: 'global',
      },
      ...buildHomeMarketingBlocks(),
    ],
    meta: {
      description:
        'Grime Time - soft-wash house washing, concrete cleaning, porch and dock cleanup, and instant estimate requests for residential exterior cleaning.',
      image: metaImage.id,
      title: 'Grime Time | Exterior cleaning',
    },
    title: 'Home',
  }
}
