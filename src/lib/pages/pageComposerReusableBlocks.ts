import { createLexicalParagraph } from '@/lib/pages/pageComposerLexical'
import { unwrapSharedSectionStructureToPageLayoutBlock } from '@/lib/pages/sharedSectionPageBridge'
import type { SharedSectionRecord } from '@/lib/pages/sharedSections'
import type { Page } from '@/payload-types'

export type PageComposerReusableMode = 'detached' | 'linked'
export type PageComposerReusableSourceType = 'preset' | 'shared-section'

type LayoutBlock = Page['layout'][number]
type SupportedReusableBlock = Extract<
  LayoutBlock,
  { blockType: 'content' | 'cta' | 'mediaBlock' | 'serviceGrid' | 'testimonialsBlock' }
>
type SharedSectionRecordLike = Pick<SharedSectionRecord, 'currentVersion' | 'id' | 'name' | 'structure'>
export type ReusableAwareLayoutBlock = LayoutBlock & {
  composerReusable?: {
    key?: null | string
    label?: null | string
    mode?: null | PageComposerReusableMode
    sharedSectionId?: null | number
    sourceType?: null | PageComposerReusableSourceType
    syncedVersion?: null | number
  } | null
}
type ResolveReusableBlockOptions = {
  sharedSectionsById?: Map<number, SharedSectionRecordLike>
}

export type PageComposerReusablePreset = {
  block: SupportedReusableBlock
  blockType: SupportedReusableBlock['blockType']
  description: string
  key: string
  label: string
}

const reusablePresets: PageComposerReusablePreset[] = [
  {
    block: {
      blockType: 'serviceGrid',
      displayVariant: 'featureCards',
      eyebrow: 'Featured services',
      heading: 'What we do',
      intro: 'Use this linked service section when the page needs a broad residential overview.',
      services: [
        {
          eyebrow: 'House wash',
          highlights: [{ text: 'Soft-wash safe for painted siding, trim, soffits, and organic buildup.' }],
          name: 'Home exterior cleaning',
          pricingHint: 'Square footage and wall count',
          summary: 'A reset for siding, trim, and entry surfaces without forcing the page into a hard quote lane.',
        },
        {
          eyebrow: 'Flatwork',
          highlights: [{ text: 'Driveways, walkways, patios, and entrance pads.' }],
          name: 'Concrete refresh',
          pricingHint: 'Surface area and condition',
          summary: 'Use this row when the page needs a clear concrete-cleaning lane with fast proof copy.',
        },
        {
          eyebrow: 'Waterfront',
          highlights: [{ text: 'Dock, patio, and rail cleaning where access changes the job.' }],
          name: 'Dock and deck cleanup',
          pricingHint: 'Access and detail work',
          summary: 'A reusable third lane for pages that need lakefront or detail-heavy work in the mix.',
        },
      ],
    },
    blockType: 'serviceGrid',
    description: 'Three-lane reusable services section with feature-card treatment.',
    key: 'service-feature-cards',
    label: 'Featured services',
  },
  {
    block: {
      blockType: 'serviceGrid',
      displayVariant: 'pricingSteps',
      eyebrow: 'Estimate logic',
      heading: 'How our pricing works',
      intro: 'Use this reusable explainer when the page needs scope and pricing context before the quote CTA.',
      services: [
        {
          eyebrow: 'Step 1',
          highlights: [{ text: 'Lead with the cleanest variable the customer already knows.' }],
          name: 'Base scope',
          pricingHint: 'Surface area',
          summary: 'Start with size, frontage, wall count, or another variable the customer can estimate quickly.',
        },
        {
          eyebrow: 'Step 2',
          highlights: [{ text: 'Condition, oxidation, grease, or buildup can move the price.' }],
          name: 'Condition and complexity',
          pricingHint: 'Severity',
          summary: 'Use the middle step for the mess, chemistry, or risk that makes one job different from another.',
        },
        {
          eyebrow: 'Step 3',
          highlights: [{ text: 'Close on access, recurrence, or scheduling friction.' }],
          name: 'Access and cadence',
          pricingHint: 'Access and frequency',
          summary: 'Finish with the operational details that shape crew time and the final quote.',
        },
      ],
    },
    blockType: 'serviceGrid',
    description: 'Reusable pricing explainer section for pre-quote education.',
    key: 'service-pricing-steps',
    label: 'Pricing steps',
  },
  {
    block: {
      blockType: 'cta',
      links: [
        {
          link: {
            appearance: 'default',
            label: 'Start the instant quote',
            newTab: false,
            type: 'custom',
            url: '/#instant-quote',
          },
        },
        {
          link: {
            appearance: 'outline',
            label: 'Talk to the crew',
            newTab: false,
            type: 'custom',
            url: '/contact',
          },
        },
      ],
      richText: createLexicalParagraph(
        'Use this callout when the page needs a direct handoff into the instant quote or contact flow.',
      ),
    },
    blockType: 'cta',
    description: 'Two-button conversion callout linked to Grime Time quote and contact flows.',
    key: 'cta-instant-quote',
    label: 'Quote CTA',
  },
  {
    block: {
      blockType: 'content',
      columns: [
        {
          richText: createLexicalParagraph('Primary slot: explain the offer, surface, or promise in one compact paragraph.'),
          size: 'twoThirds',
        },
        {
          enableLink: true,
          link: {
            appearance: 'outline',
            label: 'Open contact',
            newTab: false,
            type: 'custom',
            url: '/contact',
          },
          richText: createLexicalParagraph('Support slot: keep this column short and action-oriented.'),
          size: 'oneThird',
        },
      ],
    },
    blockType: 'content',
    description: 'Reusable two-slot content shell with a primary narrative lane and supporting action lane.',
    key: 'content-primary-support',
    label: 'Primary + support slots',
  },
]

function cloneValue<T>(value: T): T {
  return structuredClone(value)
}

export function getPageComposerReusablePresets(): PageComposerReusablePreset[] {
  return reusablePresets.map((preset) => ({
    ...preset,
    block: cloneValue(preset.block),
  }))
}

export function findPageComposerReusablePreset(key: null | string | undefined): PageComposerReusablePreset | null {
  if (!key) {
    return null
  }

  return reusablePresets.find((preset) => preset.key === key) || null
}

export function createReusablePresetBlock(args: {
  key: string
  mode: PageComposerReusableMode
}): LayoutBlock | null {
  const preset = findPageComposerReusablePreset(args.key)

  if (!preset) {
    return null
  }

  const nextBlock = cloneValue(preset.block) as ReusableAwareLayoutBlock

  nextBlock.composerReusable = {
    key: preset.key,
    label: preset.label,
    mode: args.mode,
    sourceType: 'preset',
  }

  return nextBlock as LayoutBlock
}

export function createSharedSectionLinkedBlock(args: {
  mode?: PageComposerReusableMode
  sharedSection: SharedSectionRecordLike
}): LayoutBlock | null {
  const resolved = unwrapSharedSectionStructureToPageLayoutBlock(args.sharedSection.structure)

  if (!resolved) {
    return null
  }

  const nextBlock = cloneValue(resolved) as ReusableAwareLayoutBlock
  nextBlock.composerReusable = {
    label: args.sharedSection.name,
    mode: args.mode || 'linked',
    sharedSectionId: args.sharedSection.id,
    sourceType: 'shared-section',
    syncedVersion: args.sharedSection.currentVersion,
  }

  return nextBlock as LayoutBlock
}

function resolveSharedSectionReusableBlock<T extends LayoutBlock>(args: {
  block: T
  sharedSection: SharedSectionRecordLike
}): T {
  const resolved = unwrapSharedSectionStructureToPageLayoutBlock(args.sharedSection.structure)

  if (!resolved || resolved.blockType !== args.block.blockType) {
    return cloneValue(args.block)
  }

  const reusable = (args.block as ReusableAwareLayoutBlock).composerReusable

  return {
    ...cloneValue(resolved),
    blockName: args.block.blockName,
    composerReusable: reusable
      ? {
          ...reusable,
          label: args.sharedSection.name,
          sharedSectionId: args.sharedSection.id,
          sourceType: 'shared-section',
          syncedVersion: args.sharedSection.currentVersion,
        }
      : undefined,
    id: args.block.id,
    isHidden: args.block.isHidden,
  } as unknown as T
}

export function resolvePageComposerReusableBlock<T extends LayoutBlock>(
  block: T,
  options?: ResolveReusableBlockOptions,
): T {
  const reusable = (block as ReusableAwareLayoutBlock).composerReusable
  const sourceType =
    reusable?.sourceType || (typeof reusable?.sharedSectionId === 'number' ? 'shared-section' : 'preset')

  if (reusable?.mode !== 'linked' || !reusable.key) {
    if (
      reusable?.mode === 'linked' &&
      sourceType === 'shared-section' &&
      typeof reusable?.sharedSectionId === 'number' &&
      options?.sharedSectionsById?.has(reusable.sharedSectionId)
    ) {
      return resolveSharedSectionReusableBlock({
        block,
        sharedSection: options.sharedSectionsById.get(reusable.sharedSectionId) as SharedSectionRecordLike,
      })
    }

    return cloneValue(block)
  }

  const preset = findPageComposerReusablePreset(reusable.key)

  if (!preset || preset.blockType !== block.blockType) {
    return cloneValue(block)
  }

  return {
    ...cloneValue(preset.block),
    blockName: block.blockName,
    composerReusable: reusable,
    id: block.id,
    isHidden: block.isHidden,
  } as unknown as T
}

export function isLinkedReusableBlock(block: LayoutBlock | null | undefined): boolean {
  return Boolean((block as ReusableAwareLayoutBlock | null | undefined)?.composerReusable?.mode === 'linked')
}

export function isLinkedSharedSectionBlock(block: LayoutBlock | null | undefined): boolean {
  const reusable = (block as ReusableAwareLayoutBlock | null | undefined)?.composerReusable

  return Boolean(
    reusable?.mode === 'linked' &&
      (reusable.sourceType === 'shared-section' ||
        (reusable.sourceType == null && typeof reusable.sharedSectionId === 'number')),
  )
}

export function linkedSharedSectionId(block: LayoutBlock | null | undefined): null | number {
  const reusable = (block as ReusableAwareLayoutBlock | null | undefined)?.composerReusable

  if (
    reusable?.mode === 'linked' &&
    (reusable.sourceType === 'shared-section' ||
      (reusable.sourceType == null && typeof reusable.sharedSectionId === 'number')) &&
    typeof reusable.sharedSectionId === 'number'
  ) {
    return reusable.sharedSectionId
  }

  return null
}
