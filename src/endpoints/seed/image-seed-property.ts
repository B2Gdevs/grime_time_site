import type { Media } from '@/payload-types'

/** Stock property photo used as seed only; replace with branded generated imagery or a real project photo later. */
export const imageSeedProperty: Omit<Media, 'createdAt' | 'id' | 'updatedAt'> = {
  alt: 'Clean residential exterior with bright siding and a maintained approach area',
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
              text: 'Seed property image for brand-supporting backgrounds and about/contact page visuals. Replace with generated campaign art or real project imagery later.',
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
