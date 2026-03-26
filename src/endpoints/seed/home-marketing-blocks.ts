import type { Media } from '@/payload-types'

type LexicalChild = {
  type: string
  version: number
  [key: string]: unknown
}

type BuildHomeMarketingBlocksArgs = {
  drivewayImage: Media
  houseImage: Media
  propertyImage: Media
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

const heading = (tag: 'h2' | 'h3', value: string) => ({
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

export function buildHomeMarketingBlocks({
  drivewayImage,
  houseImage,
  propertyImage,
}: BuildHomeMarketingBlocksArgs) {
  return [
    {
      blockType: 'content' as const,
      columns: [
        {
          enableLink: false,
          richText: {
            root: root([
              heading('h2', 'Clean visuals, clear scope, and less guesswork for the customer.'),
              paragraph(
                'The public site should feel like the service itself: straightforward, polished, and focused on the property. Customers should see the kinds of surfaces we clean, understand how pricing moves, and know the next step without reading a wall of filler copy.',
              ),
            ]),
          },
          size: 'full' as const,
        },
      ],
    },
    {
      blockType: 'mediaBlock' as const,
      media: drivewayImage.id,
    },
    {
      blockType: 'content' as const,
      columns: [
        {
          enableLink: false,
          richText: {
            root: root([
              heading('h3', 'Driveways and concrete should look visibly better fast.'),
              paragraph(
                'Flatwork is one of the clearest proof points on the site because customers can immediately see the difference. That makes it the right place to show action imagery, not just talk about square footage.',
              ),
            ]),
          },
          size: 'half' as const,
        },
        {
          enableLink: false,
          richText: {
            root: root([
              heading('h3', 'House washes need trust more than hype.'),
              paragraph(
                'House washing copy should emphasize soft-wash judgment, surface care, and communication. The visuals should show a clean property outcome instead of generic contractor stock that does not match the work.',
              ),
            ]),
          },
          size: 'half' as const,
        },
      ],
    },
    {
      blockType: 'mediaBlock' as const,
      media: houseImage.id,
    },
    {
      blockType: 'content' as const,
      columns: [
        {
          enableLink: false,
          richText: {
            root: root([
              heading('h2', 'Built to look professional before the customer ever books.'),
              paragraph(
                'The brand should read clean and business-minded: strong imagery, restrained backgrounds, and focused service cards that tell the customer exactly what is being cleaned and why that lane matters.',
              ),
            ]),
          },
          size: 'twoThirds' as const,
        },
        {
          enableLink: false,
          richText: {
            root: root([
              heading('h3', 'What we show'),
              paragraph(
                'Driveways, siding, porches, docks, service lanes, and other high-contrast surfaces where the cleaning result is easy to understand.',
              ),
            ]),
          },
          size: 'oneThird' as const,
        },
      ],
    },
    {
      blockType: 'mediaBlock' as const,
      media: propertyImage.id,
    },
    {
      blockType: 'cta' as const,
      links: [
        {
          link: {
            type: 'custom' as const,
            appearance: 'default' as const,
            label: 'Start instant quote',
            url: '/#instant-quote',
          },
        },
        {
          link: {
            type: 'custom' as const,
            appearance: 'outline' as const,
            label: 'Book online',
            url: '/schedule',
          },
        },
      ],
      richText: {
        root: root([
          heading('h3', 'Ready to scope the property?'),
          paragraph(
            'Start with the instant quote for a range, then let us confirm the real scope and service window before the job is scheduled.',
          ),
        ]),
      },
    },
  ]
}
