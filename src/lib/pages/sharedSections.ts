import { z } from 'zod'

export const sharedSectionCategoryValues = [
  'hero',
  'content',
  'cta',
  'social-proof',
  'media',
  'utility',
] as const

export const sharedSectionStatusValues = ['draft', 'published', 'archived'] as const

export const sharedSectionPreviewStatusValues = ['pending', 'ready', 'failed'] as const

export const sharedSectionSpacingVariantValues = ['default', 'compact', 'relaxed'] as const

export type SharedSectionCategory = (typeof sharedSectionCategoryValues)[number]
export type SharedSectionStatus = (typeof sharedSectionStatusValues)[number]
export type SharedSectionPreviewStatus = (typeof sharedSectionPreviewStatusValues)[number]
export type SharedSectionSpacingVariant = (typeof sharedSectionSpacingVariantValues)[number]

export type SectionLayoutType = string

export interface ComposerBaseNode {
  id: string
  kind: string
}

export interface ComposerBlockNode extends ComposerBaseNode {
  blockType: string
  kind: 'block'
  props: Record<string, unknown>
}

export interface ComposerColumnNode extends ComposerBaseNode {
  children: ComposerBlockNode[]
  kind: 'column'
  props: Record<string, unknown>
}

export interface ComposerRowNode extends ComposerBaseNode {
  children: ComposerColumnNode[]
  kind: 'row'
  props: Record<string, unknown>
}

export interface ComposerSectionNode extends ComposerBaseNode {
  children: ComposerRowNode[]
  kind: 'section'
  layout: SectionLayoutType
  meta?: {
    detachedAt?: string
    detachedFromSharedSectionId?: string
    detachedFromVersion?: number
  }
  props: Record<string, unknown>
}

export interface SharedSectionInstanceOverrides {
  anchorId?: string
  instanceLabel?: string
  spacingVariant?: SharedSectionSpacingVariant
  visibility?: {
    desktop?: boolean
    mobile?: boolean
    tablet?: boolean
  }
}

export interface ComposerSharedSectionInstanceNode extends ComposerBaseNode {
  kind: 'shared-section-instance'
  overrides: SharedSectionInstanceOverrides
  sharedSectionId: string
  syncedVersion: null | number
}

export type ComposerTopLevelNode = ComposerSectionNode | ComposerSharedSectionInstanceNode

export interface SharedSectionPreview {
  errorMessage?: null | string
  status: SharedSectionPreviewStatus
  updatedAt: null | string
  url: null | string
}

export interface SharedSectionDocumentShape {
  archivedAt?: null | string
  category: SharedSectionCategory
  createdBy?: null | number
  currentVersion: number
  description?: null | string
  name: string
  preview: SharedSectionPreview
  publishedAt?: null | string
  slug: string
  status: SharedSectionStatus
  structure: ComposerSectionNode
  tags: string[]
  updatedBy?: null | number
  usageCount?: number
}

export interface SharedSectionRecord {
  category: SharedSectionCategory
  createdAt: string
  currentVersion: number
  description: null | string
  id: number
  name: string
  preview: SharedSectionPreview
  publishedAt: null | string
  slug: string
  status: SharedSectionStatus
  structure: ComposerSectionNode
  tags: string[]
  updatedAt: string
  usageCount: number
}

const recordSchema = z.record(z.string(), z.unknown())

const sharedSectionPreviewSchema: z.ZodType<SharedSectionPreview> = z.object({
  errorMessage: z.string().nullable().optional(),
  status: z.enum(sharedSectionPreviewStatusValues),
  updatedAt: z.string().datetime().nullable(),
  url: z.string().nullable(),
})

const sharedSectionInstanceOverridesSchema: z.ZodType<SharedSectionInstanceOverrides> = z.object({
  anchorId: z.string().min(1).optional(),
  instanceLabel: z.string().min(1).optional(),
  spacingVariant: z.enum(sharedSectionSpacingVariantValues).optional(),
  visibility: z
    .object({
      desktop: z.boolean().optional(),
      mobile: z.boolean().optional(),
      tablet: z.boolean().optional(),
    })
    .optional(),
})

const composerBlockNodeSchema: z.ZodType<ComposerBlockNode> = z.object({
  blockType: z.string().min(1),
  id: z.string().min(1),
  kind: z.literal('block'),
  props: recordSchema,
})

const composerColumnNodeSchema: z.ZodType<ComposerColumnNode> = z.object({
  children: z.array(composerBlockNodeSchema),
  id: z.string().min(1),
  kind: z.literal('column'),
  props: recordSchema,
})

const composerRowNodeSchema: z.ZodType<ComposerRowNode> = z.object({
  children: z.array(composerColumnNodeSchema),
  id: z.string().min(1),
  kind: z.literal('row'),
  props: recordSchema,
})

export const composerSectionNodeSchema: z.ZodType<ComposerSectionNode> = z.object({
  children: z.array(composerRowNodeSchema),
  id: z.string().min(1),
  kind: z.literal('section'),
  layout: z.string().min(1),
  meta: z
    .object({
      detachedAt: z.string().datetime().optional(),
      detachedFromSharedSectionId: z.string().min(1).optional(),
      detachedFromVersion: z.number().int().positive().optional(),
    })
    .optional(),
  props: recordSchema,
})

export const composerSharedSectionInstanceNodeSchema: z.ZodType<ComposerSharedSectionInstanceNode> =
  z.object({
    id: z.string().min(1),
    kind: z.literal('shared-section-instance'),
    overrides: sharedSectionInstanceOverridesSchema,
    sharedSectionId: z.string().min(1),
    syncedVersion: z.number().int().positive().nullable(),
  })

function randomId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

export function createDefaultSharedSectionPreview(): SharedSectionPreview {
  return {
    errorMessage: null,
    status: 'pending',
    updatedAt: null,
    url: null,
  }
}

export function createDefaultSharedSectionStructure(): ComposerSectionNode {
  return {
    children: [
      {
        children: [
          {
            children: [
              {
                blockType: 'content',
                id: randomId('block'),
                kind: 'block',
                props: {
                  columns: [
                    {
                      size: 'full',
                    },
                  ],
                },
              },
            ],
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
    layout: 'content',
    props: {},
  }
}

export function normalizeSharedSectionTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return Array.from(
    new Set(
      value
        .map((entry) => (typeof entry === 'string' ? entry : typeof entry === 'object' && entry && 'tag' in entry ? entry.tag : ''))
        .map((entry) => (typeof entry === 'string' ? entry.trim().toLowerCase() : ''))
        .filter(Boolean),
    ),
  )
}

export function validateSharedSectionStructure(
  value: unknown,
): { issues: string[]; ok: boolean; value?: ComposerSectionNode } {
  const result = composerSectionNodeSchema.safeParse(value)

  if (result.success) {
    const section = result.data
    const row = section.children[0]
    const column = row?.children[0]
    const block = column?.children[0]
    const issues: string[] = []

    if (section.children.length !== 1) {
      issues.push('structure: shared sections must use exactly one row in phase 18.')
    }

    if (!row || row.children.length !== 1) {
      issues.push('structure.children.0: shared sections must use exactly one column in phase 18.')
    }

    if (!column || column.children.length !== 1 || !block) {
      issues.push('structure.children.0.children.0: shared sections must map to exactly one composer block in phase 18.')
    }

    if (issues.length) {
      return {
        issues,
        ok: false,
      }
    }

    return {
      ok: true,
      value: section,
      issues: [],
    }
  }

  return {
    issues: result.error.issues.map((issue) => {
      const path = issue.path.length ? issue.path.join('.') : 'structure'
      return `${path}: ${issue.message}`
    }),
    ok: false,
  }
}

export function buildSharedSectionStructureValidationMessage(value: unknown): string | true {
  const result = validateSharedSectionStructure(value)
  return result.ok ? true : result.issues[0] || 'Shared section structure is invalid.'
}

export function normalizeSharedSectionPreview(value: unknown): SharedSectionPreview {
  const parsed = sharedSectionPreviewSchema.safeParse(value)

  if (parsed.success) {
    return parsed.data
  }

  return createDefaultSharedSectionPreview()
}

export function createPendingSharedSectionPreview(): SharedSectionPreview {
  return createDefaultSharedSectionPreview()
}

export function prepareSharedSectionDocumentChange(args: {
  canChangeStatus: boolean
  data: Partial<SharedSectionDocumentShape>
  now?: Date
  operation: 'create' | 'update'
  originalDoc?: null | Partial<SharedSectionDocumentShape>
  userId?: null | number
}): SharedSectionDocumentShape {
  const nowIso = (args.now || new Date()).toISOString()
  const original = args.originalDoc || null
  const originalStatus = original?.status || 'draft'
  const nextStatus = args.data.status || originalStatus
  const nextStructure = (args.data.structure || original?.structure || createDefaultSharedSectionStructure()) as unknown
  const validatedStructure = validateSharedSectionStructure(nextStructure)

  if (!validatedStructure.ok || !validatedStructure.value) {
    throw new Error(validatedStructure.issues[0] || 'Shared section structure is invalid.')
  }

  const statusChanged = nextStatus !== originalStatus

  if ((nextStatus === 'published' || nextStatus === 'archived') && statusChanged && !args.canChangeStatus) {
    throw new Error('You do not have permission to publish or archive shared sections.')
  }

  const structureChanged =
    args.operation === 'create' ||
    (args.data.structure !== undefined &&
      JSON.stringify(args.data.structure || null) !== JSON.stringify(original?.structure || null))

  const originalVersion = original?.currentVersion || 1
  const nextVersion =
    args.operation === 'create'
      ? 1
      : nextStatus === 'published' && (statusChanged || structureChanged)
        ? originalVersion + 1
        : originalVersion

  const preview = structureChanged
    ? createPendingSharedSectionPreview()
    : normalizeSharedSectionPreview(args.data.preview || original?.preview)

  const publishedAt =
    nextStatus === 'published'
      ? statusChanged && originalStatus !== 'published'
        ? nowIso
        : (args.data.publishedAt ?? original?.publishedAt ?? nowIso)
      : (args.data.publishedAt ?? original?.publishedAt ?? null)

  const archivedAt =
    nextStatus === 'archived'
      ? statusChanged && originalStatus !== 'archived'
        ? nowIso
        : (args.data.archivedAt ?? original?.archivedAt ?? nowIso)
      : nextStatus === 'published' || nextStatus === 'draft'
        ? null
        : (args.data.archivedAt ?? original?.archivedAt ?? null)

  return {
    archivedAt,
    category: args.data.category || original?.category || 'content',
    createdBy:
      args.operation === 'create'
        ? (args.data.createdBy ?? args.userId ?? null)
        : (original?.createdBy ?? args.data.createdBy ?? null),
    currentVersion: nextVersion,
    description: args.data.description ?? original?.description ?? null,
    name: args.data.name || original?.name || 'Untitled shared section',
    preview,
    publishedAt,
    slug: args.data.slug || original?.slug || 'untitled-shared-section',
    status: nextStatus,
    structure: validatedStructure.value,
    tags: normalizeSharedSectionTags(args.data.tags ?? original?.tags ?? []),
    updatedBy: args.userId ?? args.data.updatedBy ?? original?.updatedBy ?? null,
    usageCount: args.data.usageCount ?? original?.usageCount ?? 0,
  }
}
