import type { Media } from '@/payload-types'

/** Stock photo used as seed only; replace with real before/after shots in admin when ready. */
export const imageSeedDriveway: Omit<Media, 'createdAt' | 'id' | 'updatedAt'> = {
  alt: 'Concrete driveway and walkway used as a seeded flatwork-cleaning placeholder',
  caption: {
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
              text: 'Seed driveway image for flatwork proof and action-oriented service sections. Replace with real before/after or generated crew imagery when available.',
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
}
