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
  galleryBottom,
  galleryMid,
  galleryTop,
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
                  text: 'House washes, driveways, patios, docks, and repeat exterior-cleaning work for customers who want the property to look sharp without guessing their way through the process. Start with an instant estimate, then let us confirm the real scope before we schedule. ',
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
        eyebrow: 'Featured services',
        heading: 'What we do',
        intro:
          'Exterior cleaning should show the work clearly. These cards now carry real Payload media so the homepage can sell the service visually instead of leaning on generic filler copy.',
        services: [
          {
            eyebrow: 'Soft wash',
            media: galleryTop.id,
            name: 'House washing',
            pricingHint: 'Home size, stories, buildup, and setup time',
            summary:
              'Soft washing for siding, trim, soffits, and everyday organic buildup without blasting delicate surfaces.',
            highlights: [
              {
                text: 'Best lane for homeowners who want maintenance without surface risk.',
              },
              {
                text: 'Good fit for recurring plans and curb-appeal refreshes.',
              },
              {
                text: 'Scope changes when the property is taller, tighter, or dirtier than expected.',
              },
            ],
          },
          {
            eyebrow: 'High-contrast result',
            media: galleryMid.id,
            name: 'Driveways, walkways, and patios',
            pricingHint: 'Square footage, stain severity, edges, and rinse detail',
            summary:
              'Flatwork cleaning priced mostly by square footage, stain severity, and how much prep/detail work the area needs.',
            highlights: [
              {
                text: 'Strong visual proof service for the public site and before/after content.',
              },
              {
                text: 'Easy add-on when the property already needs a house wash.',
              },
              {
                text: 'Heavier staining and runoff control change the economics fast.',
              },
            ],
          },
          {
            eyebrow: 'Outdoor living',
            media: heroImage.id,
            name: 'Porches and outdoor living areas',
            pricingHint: 'Minimum charge, complexity, furniture, and rail detail',
            summary:
              'Front porches, steps, and mixed-surface patios where detail work matters as much as raw square footage.',
            highlights: [
              {
                text: 'Mixed materials and small details can take more time than the size suggests.',
              },
              {
                text: 'Good place to show clean, intentional imagery instead of stock contractor shots.',
              },
            ],
          },
          {
            eyebrow: 'Waterfront surfaces',
            media: galleryBottom.id,
            name: 'Docks and waterfront surfaces',
            pricingHint: 'Surface area, algae severity, access, rails, and safety review',
            summary:
              'Dock cleaning and algae-heavy work with extra review for stairs, rails, access, and surface safety.',
            highlights: [
              {
                text: 'Water-side jobs need more scope clarity and safety discipline than normal flatwork.',
              },
              {
                text: 'Algae, slip risk, and access should be reflected in the quote.',
              },
            ],
          },
          {
            eyebrow: 'Growth lane',
            media: galleryMid.id,
            name: 'Commercial growth path',
            pricingHint: 'Custom scope, route density, recurrence, and liability',
            summary:
              'Dumpsters, service lanes, and repeat commercial flatwork are on the roadmap, but still go through custom scope review today.',
            highlights: [
              {
                text: 'Commercial accounts should feel deliberate, not like an afterthought on a residential page.',
              },
              {
                text: 'Monthly invoicing and recurring service windows can layer in as the commercial model matures.',
              },
            ],
          },
        ],
      },
      {
        blockType: 'serviceGrid',
        eyebrow: 'Estimate logic',
        heading: 'How our pricing works',
        intro:
          'We do not guess from a single photo. Instant quotes start with square footage, then adjust for condition, stories, access, and how often you want the service.',
        services: [
          {
            eyebrow: 'Step 1',
            name: '1. Square footage',
            pricingHint: 'Base range',
            summary:
              'Most residential flatwork and house washing starts with approximate square footage so the estimate scales with the size of the job.',
            highlights: [
              {
                text: 'The range needs to be useful without pretending it is the final approved scope.',
              },
            ],
          },
          {
            eyebrow: 'Step 2',
            name: '2. Surface risk and condition',
            pricingHint: 'Condition multiplier',
            summary:
              'Heavy algae, oxidation, grease, delicate trim, waterfront buildup, and deep staining usually push the quote upward.',
            highlights: [
              {
                text: 'Condition is where cheap flat pricing breaks down on real jobs.',
              },
            ],
          },
          {
            eyebrow: 'Step 3',
            name: '3. Access and recurrence',
            pricingHint: 'Access and schedule',
            summary:
              'Multi-story work, difficult setup, gates, stairs, or dock access add labor, while quarterly and maintenance plans can lower per-visit pricing.',
            highlights: [
              {
                text: 'Recurring service lowers per-visit cost, but only when the scope is stable.',
              },
            ],
          },
        ],
      },
      {
        blockType: 'pricingTable',
        dataSource: 'global',
      },
      ...buildHomeMarketingBlocks({
        drivewayImage: galleryMid,
        houseImage: galleryTop,
        propertyImage: galleryBottom,
      }),
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
