import type { Media } from '@/payload-types'

/** Stock photo used as seed only; replace with your own job photos in admin when ready. */
export const imageSeedHouse: Omit<Media, 'createdAt' | 'id' | 'updatedAt'> = {
  alt: 'Residential home with siding and driveway, used as a seeded exterior-cleaning placeholder',
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
              text: 'Seed house image for siding, trim, and whole-property presentation. Replace with a branded generated asset or real job photo when ready.',
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
