import type { RequiredDataFromCollectionSlug } from 'payload'
import type { Media } from '@/payload-types'

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
      links: [],
      media: heroImage.id,
      richText: {
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
                  text: 'Straight numbers, clear scope, and a live range before we lock the job.',
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
            media: galleryMid.id,
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
            media: galleryTop.id,
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
            media: galleryBottom.id,
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
    ],
    meta: {
      description:
        'Grime Time — exterior cleaning in North Texas. Instant quote range, then we confirm scope and schedule.',
      image: metaImage.id,
      title: 'Grime Time | Exterior cleaning',
    },
    title: 'Home',
  }
}
