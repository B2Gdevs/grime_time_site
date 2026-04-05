import { describe, expect, it } from 'vitest'

import {
  createSharedSectionStructureFromCategory,
  unwrapSharedSectionStructureToPageLayoutBlock,
  wrapPageLayoutBlockAsSharedSectionStructure,
} from '@/lib/pages/sharedSectionPageBridge'
import { createPageComposerBlock } from '@/lib/pages/pageComposerBlockRegistry'
import {
  createDefaultSharedSectionPreview,
  createDefaultSharedSectionStructure,
  prepareSharedSectionDocumentChange,
  validateSharedSectionStructure,
} from '@/lib/pages/sharedSections'

describe('shared section helpers', () => {
  it('creates a valid default structure and preview scaffold', () => {
    const structure = createDefaultSharedSectionStructure()
    const preview = createDefaultSharedSectionPreview()

    expect(validateSharedSectionStructure(structure)).toMatchObject({ ok: true })
    expect(preview).toEqual({
      errorMessage: null,
      status: 'pending',
      updatedAt: null,
      url: null,
    })
  })

  it('rejects a shared-section instance as source structure', () => {
    const result = validateSharedSectionStructure({
      id: 'shared-1',
      kind: 'shared-section-instance',
      overrides: {},
      sharedSectionId: 'source-1',
      syncedVersion: 2,
    })

    expect(result.ok).toBe(false)
    expect(result.issues.length).toBeGreaterThan(0)
  })

  it('rejects shared-section structures that exceed the phase-18 single-block constraint', () => {
    const sourceBlock = createPageComposerBlock('cta')
    const wrapped = wrapPageLayoutBlockAsSharedSectionStructure(sourceBlock)
    wrapped.children[0]?.children[0]?.children.push({
      blockType: 'cta',
      id: 'block-2',
      kind: 'block',
      props: { links: [] },
    })

    const result = validateSharedSectionStructure(wrapped)

    expect(result.ok).toBe(false)
    expect(result.issues[0]).toContain('exactly one composer block')
  })

  it('initializes new shared sections as draft version 1 with pending preview', () => {
    const structure = createDefaultSharedSectionStructure()
    const prepared = prepareSharedSectionDocumentChange({
      canChangeStatus: false,
      data: {
        category: 'hero',
        name: 'Homepage Hero',
        slug: 'homepage-hero',
        structure,
        tags: [{ tag: 'Residential' }, { tag: 'before-after' }] as never,
      },
      operation: 'create',
      userId: 42,
    })

    expect(prepared).toMatchObject({
      category: 'hero',
      createdBy: 42,
      currentVersion: 1,
      name: 'Homepage Hero',
      slug: 'homepage-hero',
      status: 'draft',
      tags: ['residential', 'before-after'],
      updatedBy: 42,
      usageCount: 0,
    })
    expect(prepared.preview.status).toBe('pending')
  })

  it('bridges composer blocks into shared-section structures and back again', () => {
    const sourceBlock = createPageComposerBlock('cta')
    const wrapped = wrapPageLayoutBlockAsSharedSectionStructure(sourceBlock)

    expect(validateSharedSectionStructure(wrapped)).toMatchObject({ ok: true })
    expect(unwrapSharedSectionStructureToPageLayoutBlock(wrapped)).toMatchObject({
      blockType: 'cta',
    })
  })

  it('seeds new shared sections from a category-specific composer template', () => {
    const structure = createSharedSectionStructureFromCategory('social-proof')
    const block = unwrapSharedSectionStructureToPageLayoutBlock(structure)

    expect(block).toMatchObject({
      blockType: 'testimonialsBlock',
    })
  })

  it('increments version and stamps publish metadata when a draft is published', () => {
    const original = prepareSharedSectionDocumentChange({
      canChangeStatus: false,
      data: {
        category: 'content',
        name: 'Trust Band',
        slug: 'trust-band',
        structure: createDefaultSharedSectionStructure(),
      },
      operation: 'create',
      userId: 10,
    })

    const published = prepareSharedSectionDocumentChange({
      canChangeStatus: true,
      data: {
        status: 'published',
        structure: {
          ...original.structure,
          props: { eyebrow: 'Trusted by local homeowners' },
        },
      },
      now: new Date('2026-04-04T22:00:00.000Z'),
      operation: 'update',
      originalDoc: original,
      userId: 11,
    })

    expect(published.currentVersion).toBe(2)
    expect(published.publishedAt).toBe('2026-04-04T22:00:00.000Z')
    expect(published.status).toBe('published')
    expect(published.updatedBy).toBe(11)
    expect(published.preview.status).toBe('pending')
  })

  it('blocks publish transitions for users without publish permission', () => {
    const original = prepareSharedSectionDocumentChange({
      canChangeStatus: false,
      data: {
        category: 'cta',
        name: 'Quote CTA',
        slug: 'quote-cta',
        structure: createDefaultSharedSectionStructure(),
      },
      operation: 'create',
      userId: 5,
    })

    expect(() =>
      prepareSharedSectionDocumentChange({
        canChangeStatus: false,
        data: {
          status: 'published',
        },
        operation: 'update',
        originalDoc: original,
        userId: 5,
      }),
    ).toThrow('You do not have permission to publish or archive shared sections.')
  })
})
