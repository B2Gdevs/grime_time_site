import type { Page } from '@/payload-types'

export type PageComposerBlockCategory = 'container' | 'dynamic' | 'static'
export type PageComposerRegisteredBlockType = Page['layout'][number]['blockType'] | 'customHtml'
export type PageComposerInsertableBlockType = PageComposerRegisteredBlockType

export type PageComposerBlockDefinition = {
  category: PageComposerBlockCategory
  description: string
  keywords: string[]
  label: string
  supportsInsert: boolean
  supportsNesting: boolean
  supportsReusable: boolean
  type: PageComposerRegisteredBlockType
}

type LayoutBlock = Page['layout'][number]

const DEFAULT_SERVICE_ROWS = [
  {
    eyebrow: 'Primary lane',
    highlights: [{ text: 'Replace this proof point with the real promise for this section.' }],
    name: 'Section item one',
    pricingHint: 'What changes the quote',
    summary: 'Describe the main service, step, or selling point for this row.',
  },
  {
    eyebrow: 'Secondary lane',
    highlights: [{ text: 'Add a short supporting detail or scope note.' }],
    name: 'Section item two',
    pricingHint: 'Scope note',
    summary: 'Use this row for a second service, proof point, or supporting detail.',
  },
  {
    eyebrow: 'Third lane',
    highlights: [{ text: 'Keep defaults short so staff can swap them quickly.' }],
    name: 'Section item three',
    pricingHint: 'Optional detail',
    summary: 'Duplicate or rewrite this row to fit the page.',
  },
] satisfies NonNullable<Extract<LayoutBlock, { blockType: 'serviceGrid' }>['services']>

function cloneValue<T>(value: T): T {
  return structuredClone(value)
}

const pageComposerBlockDefinitions: PageComposerBlockDefinition[] = [
  {
    category: 'static',
    description: 'Branded service cards or pricing-step style sections authored directly on the page.',
    keywords: ['service', 'services', 'cards', 'pricing steps', 'homepage'],
    label: 'Service grid',
    supportsInsert: true,
    supportsNesting: false,
    supportsReusable: true,
    type: 'serviceGrid',
  },
  {
    category: 'dynamic',
    description: 'Pricing lanes powered by the shared pricing global or inline plans on the page.',
    keywords: ['pricing', 'plans', 'packages', 'quote'],
    label: 'Pricing table',
    supportsInsert: true,
    supportsNesting: false,
    supportsReusable: false,
    type: 'pricingTable',
  },
  {
    category: 'static',
    description: 'Rich marketing copy plus CTA links.',
    keywords: ['cta', 'call to action', 'buttons', 'links'],
    label: 'Call to action',
    supportsInsert: true,
    supportsNesting: false,
    supportsReusable: true,
    type: 'cta',
  },
  {
    category: 'container',
    description: 'Multi-column content layout with rich text and optional links.',
    keywords: ['content', 'columns', 'rich text', 'layout'],
    label: 'Content columns',
    supportsInsert: true,
    supportsNesting: true,
    supportsReusable: true,
    type: 'content',
  },
  {
    category: 'static',
    description: 'Single media section for a strong image or video asset.',
    keywords: ['media', 'image', 'video', 'photo'],
    label: 'Media block',
    supportsInsert: true,
    supportsNesting: false,
    supportsReusable: true,
    type: 'mediaBlock',
  },
  {
    category: 'dynamic',
    description: 'Collection-driven archive or selected-post section.',
    keywords: ['archive', 'posts', 'blog', 'news'],
    label: 'Archive',
    supportsInsert: true,
    supportsNesting: false,
    supportsReusable: false,
    type: 'archive',
  },
  {
    category: 'dynamic',
    description: 'Generic Payload form block bound to a selected form record.',
    keywords: ['form', 'lead', 'capture', 'signup'],
    label: 'Form block',
    supportsInsert: true,
    supportsNesting: false,
    supportsReusable: false,
    type: 'formBlock',
  },
  {
    category: 'dynamic',
    description: 'First-party contact request block wired to the lead flow.',
    keywords: ['contact', 'lead', 'request', 'crm'],
    label: 'Contact request',
    supportsInsert: true,
    supportsNesting: false,
    supportsReusable: false,
    type: 'contactRequest',
  },
  {
    category: 'dynamic',
    description: 'Testimonials section powered by selected or latest testimonial records.',
    keywords: ['testimonials', 'reviews', 'social proof'],
    label: 'Testimonials',
    supportsInsert: true,
    supportsNesting: false,
    supportsReusable: true,
    type: 'testimonialsBlock',
  },
  {
    category: 'static',
    description: 'Trusted embed or markup block with sanitized rendering for approved HTML snippets.',
    keywords: ['html', 'embed', 'widget', 'custom code'],
    label: 'Custom HTML',
    supportsInsert: true,
    supportsNesting: false,
    supportsReusable: false,
    type: 'customHtml',
  },
]

const pageComposerBlockDefinitionMap = new Map(
  pageComposerBlockDefinitions.map((definition) => [definition.type, definition]),
)

export function getPageComposerBlockDefinitions(): PageComposerBlockDefinition[] {
  return pageComposerBlockDefinitions.map((definition) => ({ ...definition }))
}

export function getPageComposerInsertableBlocks(): PageComposerBlockDefinition[] {
  return pageComposerBlockDefinitions
    .filter((definition) => definition.supportsInsert)
    .map((definition) => ({ ...definition }))
}

export function findPageComposerBlockDefinition(
  type: null | PageComposerRegisteredBlockType | string | undefined,
): PageComposerBlockDefinition | null {
  if (!type) {
    return null
  }

  return pageComposerBlockDefinitionMap.get(type as PageComposerRegisteredBlockType) || null
}

export function createPageComposerBlock(type: PageComposerInsertableBlockType): LayoutBlock {
  if (type === 'serviceGrid') {
    return {
      blockType: 'serviceGrid',
      displayVariant: 'interactive',
      eyebrow: 'Section label',
      heading: 'Interactive service section',
      intro: 'Use this reusable service section anywhere on the page.',
      services: cloneValue(DEFAULT_SERVICE_ROWS),
    }
  }

  if (type === 'pricingTable') {
    return {
      blockType: 'pricingTable',
      dataSource: 'global',
      heading: 'Pricing & packages',
      inlinePlans: [],
    }
  }

  if (type === 'cta') {
    return {
      blockType: 'cta',
      links: [],
    }
  }

  if (type === 'content') {
    return {
      blockType: 'content',
      columns: [
        {
          size: 'full',
        },
      ],
    }
  }

  if (type === 'mediaBlock') {
    return {
      blockType: 'mediaBlock',
      media: 0,
    }
  }

  if (type === 'archive') {
    return {
      blockType: 'archive',
      categories: [],
      limit: 6,
      populateBy: 'collection',
      relationTo: 'posts',
      selectedDocs: [],
    }
  }

  if (type === 'formBlock') {
    return {
      blockType: 'formBlock',
      enableIntro: false,
      form: 0,
    }
  }

  if (type === 'contactRequest') {
    return {
      blockType: 'contactRequest',
      layoutVariant: 'default',
    }
  }

  if (type === 'customHtml') {
    return {
      blockType: 'customHtml',
      html: '<div class="gt-embed-shell">Trusted HTML snippet</div>',
      label: 'Custom HTML',
    } as LayoutBlock
  }

  return {
    blockType: 'testimonialsBlock',
    heading: 'Testimonials',
    limit: 6,
    selectionMode: 'selected',
    testimonials: [],
  }
}
