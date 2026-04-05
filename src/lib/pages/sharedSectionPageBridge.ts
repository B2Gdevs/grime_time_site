import {
  createPageComposerBlock,
  type PageComposerInsertableBlockType,
} from '@/lib/pages/pageComposerBlockRegistry'
import type {
  ComposerBlockNode,
  ComposerSectionNode,
  SharedSectionCategory,
} from '@/lib/pages/sharedSections'
import type { Page } from '@/payload-types'

type LayoutBlock = Page['layout'][number]

function cloneValue<T>(value: T): T {
  return structuredClone(value)
}

function randomId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

function stripBlockType(block: LayoutBlock): Omit<LayoutBlock, 'blockType'> {
  const { blockType: _blockType, ...props } = cloneValue(block)
  return props
}

export function wrapPageLayoutBlockAsSharedSectionStructure(block: LayoutBlock): ComposerSectionNode {
  const blockNode: ComposerBlockNode = {
    blockType: block.blockType,
    id: randomId('block'),
    kind: 'block',
    props: stripBlockType(block),
  }

  return {
    children: [
      {
        children: [
          {
            children: [blockNode],
            id: randomId('column'),
            kind: 'column',
            props: {},
          },
        ],
        id: randomId('row'),
        kind: 'row',
        props: {},
      },
    ],
    id: randomId('section'),
    kind: 'section',
    layout: block.blockType,
    props: {},
  }
}

export function unwrapSharedSectionStructureToPageLayoutBlock(
  structure: ComposerSectionNode,
): LayoutBlock | null {
  const row = structure.children[0]
  const column = row?.children[0]
  const block = column?.children[0]

  if (!row || !column || !block) {
    return null
  }

  if (structure.children.length !== 1 || row.children.length !== 1 || column.children.length !== 1) {
    return null
  }

  return {
    blockType: block.blockType as LayoutBlock['blockType'],
    ...cloneValue(block.props),
  } as LayoutBlock
}

export function defaultSharedSectionBlockTypeForCategory(
  category: SharedSectionCategory,
): PageComposerInsertableBlockType {
  if (category === 'cta') {
    return 'cta'
  }

  if (category === 'social-proof') {
    return 'testimonialsBlock'
  }

  if (category === 'media') {
    return 'mediaBlock'
  }

  return 'content'
}

export function createSharedSectionStructureFromCategory(category: SharedSectionCategory): ComposerSectionNode {
  return wrapPageLayoutBlockAsSharedSectionStructure(
    createPageComposerBlock(defaultSharedSectionBlockTypeForCategory(category)),
  )
}
