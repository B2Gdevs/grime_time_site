/** Matches Payload Lexical `root.children` typing used in seed block content. */
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

export function buildHomeMarketingBlocks() {
  return [
    {
      blockType: 'content' as const,
      columns: [
        {
          enableLink: false,
          richText: {
            root: root([
              heading('h2', 'Why Grime Time gets called back'),
              paragraph(
                'Homeowners choose us because we protect the surfaces first, explain the scope before we start, and leave the property looking better than the quote promised. We are not trying to race through a wash with maximum pressure and minimum care.',
              ),
              paragraph(
                'Residential work is the core right now: siding, driveways, porches, patios, and docks. Commercial work is the next lane, but we are still building that side carefully instead of pretending every property fits the same playbook.',
              ),
            ]),
          },
          size: 'full' as const,
        },
      ],
    },
    {
      blockType: 'content' as const,
      columns: [
        {
          enableLink: false,
          richText: {
            root: root([
              heading('h3', 'Soft-wash where it matters'),
              paragraph(
                'Siding, trim, soffits, painted surfaces, and delicate materials get a lower-pressure approach built around cleaning without forcing damage.',
              ),
            ]),
          },
          size: 'oneThird' as const,
        },
        {
          enableLink: false,
          richText: {
            root: root([
              heading('h3', 'Concrete done with intention'),
              paragraph(
                'Driveways, walkways, and patios still need real surface cleaning, but the quote should reflect stains, runoff, edges, and detail work instead of a lazy flat rate.',
              ),
            ]),
          },
          size: 'oneThird' as const,
        },
        {
          enableLink: false,
          richText: {
            root: root([
              heading('h3', 'Clear scope before arrival'),
              paragraph(
                'We want the customer to know the service window, the access needs, and what is included before the crew unloads anything at the property.',
              ),
            ]),
          },
          size: 'oneThird' as const,
        },
      ],
    },
    {
      blockType: 'content' as const,
      columns: [
        {
          enableLink: false,
          richText: {
            root: root([
              heading('h2', 'What a quote should actually cover'),
              paragraph(
                'Instant estimates should get the customer close, not trap the business in bad pricing. We start with square footage, then adjust for stories, condition, access, setup time, and recurrence.',
              ),
              paragraph(
                'That means a driveway estimate can move if there is heavy buildup or edge detail, and a house wash can move if the property is taller, tighter, or dirtier than the first form makes it look.',
              ),
            ]),
          },
          size: 'full' as const,
        },
      ],
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
            'Tell us what needs to be cleaned, the rough size of the area, and anything unusual about access or buildup. We will turn that into a real next step instead of a generic contact form dead end.',
          ),
        ]),
      },
    },
  ]
}
