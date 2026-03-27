import type { Media } from '@/payload-types'

/** Lexical caption paragraph for seeded library media (no rich formatting). */
export function genericMediaSeed({
  alt,
  caption,
}: {
  alt: string
  caption: string
}): Omit<Media, 'createdAt' | 'id' | 'updatedAt'> {
  return {
    alt,
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
                text: caption,
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
}
