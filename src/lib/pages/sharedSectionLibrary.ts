import { createLocalReq, type Payload, type TypeWithVersion, type Where } from 'payload'

import type { getCurrentAuthContext } from '@/lib/auth/getAuthContext'
import { resolveSharedSectionPermissions } from '@/lib/auth/sharedSectionPermissions'
import { createSharedSectionStructureFromCategory } from '@/lib/pages/sharedSectionPageBridge'
import {
  createDefaultSharedSectionStructure,
  normalizeSharedSectionPreview,
  normalizeSharedSectionTags,
  validateSharedSectionStructure,
  type ComposerSectionNode,
  type SharedSectionCategory,
  type SharedSectionRecord,
  type SharedSectionStatus,
  type SharedSectionVersionSummary,
} from '@/lib/pages/sharedSections'
import type { SharedSection } from '@/payload-types'

type PayloadContext = Awaited<ReturnType<typeof getCurrentAuthContext>>

function normalizeSharedSectionStructure(value: SharedSection['structure']): ComposerSectionNode {
  const validated = validateSharedSectionStructure(value)
  return validated.ok && validated.value ? validated.value : createDefaultSharedSectionStructure()
}

export function toSharedSectionRecord(record: SharedSection): SharedSectionRecord {
  return {
    category: record.category,
    createdAt: record.createdAt,
    currentVersion: record.currentVersion,
    description: record.description || null,
    id: record.id,
    name: record.name,
    preview: normalizeSharedSectionPreview(record.preview),
    publishedAt: record.publishedAt || null,
    slug: record.slug,
    status: record.status,
    structure: normalizeSharedSectionStructure(record.structure),
    tags: normalizeSharedSectionTags(record.tags?.map((entry) => entry.tag) || []),
    updatedAt: record.updatedAt,
    usageCount: typeof record.usageCount === 'number' ? record.usageCount : 0,
  }
}

function buildSharedSectionWhere(args: {
  category?: null | string
  search?: null | string
  status?: null | SharedSectionStatus
  tag?: null | string
}): undefined | Where {
  const clauses: Where[] = []
  const search = args.search?.trim()
  const tag = args.tag?.trim().toLowerCase()
  const category = args.category?.trim()

  if (category) {
    clauses.push({
      category: {
        equals: category,
      },
    } as Where)
  }

  if (args.status) {
    clauses.push({
      status: {
        equals: args.status,
      },
    } as Where)
  }

  if (tag) {
    clauses.push({
      'tags.tag': {
        equals: tag,
      },
    } as Where)
  }

  if (search) {
    clauses.push({
      or: [
        {
          name: {
            contains: search,
          },
        },
        {
          slug: {
            contains: search,
          },
        },
        {
          description: {
            contains: search,
          },
        },
      ],
    } as Where)
  }

  if (!clauses.length) {
    return undefined
  }

  return clauses.length === 1 ? clauses[0] : { and: clauses }
}

export async function loadSharedSectionsLibrary(args: {
  auth: PayloadContext
  category?: null | string
  id?: null | number
  search?: null | string
  status?: null | SharedSectionStatus
  tag?: null | string
}) {
  const payloadReq = await createLocalReq({ user: args.auth.realUser || undefined }, args.auth.payload)
  const permissions = await resolveSharedSectionPermissions(args.auth.payload, args.auth.realUser)

  const result = args.id
    ? {
        docs: [
          (await args.auth.payload.findByID({
            collection: 'shared-sections',
            depth: 1,
            draft: true,
            id: args.id,
            overrideAccess: false,
            req: payloadReq,
          })) as SharedSection,
        ],
      }
    : await args.auth.payload.find({
        collection: 'shared-sections',
        depth: 1,
        draft: true,
        limit: 100,
        overrideAccess: false,
        pagination: false,
        req: payloadReq,
        sort: '-updatedAt',
        where: buildSharedSectionWhere({
          category: args.category,
          search: args.search,
          status: args.status,
          tag: args.tag,
        }),
      })

  return {
    items: (result.docs as SharedSection[]).map((record) => toSharedSectionRecord(record)),
    permissions,
  }
}

function toSharedSectionVersionSummary(
  record: TypeWithVersion<SharedSection>,
): SharedSectionVersionSummary {
  const status =
    typeof record.version.status === 'string'
      ? record.version.status
      : record.version._status === 'published'
        ? 'published'
        : 'draft'

  return {
    createdAt: record.createdAt,
    id: record.id,
    latest: Boolean(record.latest),
    status,
    updatedAt: record.updatedAt,
    versionNumber:
      typeof record.version.currentVersion === 'number' && record.version.currentVersion > 0
        ? record.version.currentVersion
        : 1,
  }
}

export async function loadSharedSectionVersionSummaries(args: {
  auth: PayloadContext
  id: number
  limit?: number
}): Promise<SharedSectionVersionSummary[]> {
  const payloadReq = await createLocalReq({ user: args.auth.realUser || undefined }, args.auth.payload)
  const result = await args.auth.payload.findVersions({
    collection: 'shared-sections',
    depth: 0,
    limit: args.limit || 8,
    overrideAccess: false,
    pagination: false,
    req: payloadReq,
    sort: '-updatedAt',
    where: {
      parent: {
        equals: args.id,
      },
    },
  })

  return (result.docs as TypeWithVersion<SharedSection>[]).map((record) =>
    toSharedSectionVersionSummary(record),
  )
}

export async function createSharedSectionDraft(args: {
  auth: PayloadContext
  data: {
    category: SharedSectionCategory
    description?: null | string
    name: string
    slug?: null | string
    structure?: ComposerSectionNode | null
    tags?: string[]
  }
}) {
  const payloadReq = await createLocalReq({ user: args.auth.realUser || undefined }, args.auth.payload)

  const created = (await args.auth.payload.create({
    collection: 'shared-sections',
        data: {
          category: args.data.category,
          description: args.data.description || null,
          name: args.data.name.trim(),
          slug: args.data.slug?.trim() || undefined,
          status: 'draft',
          structure: (args.data.structure || createSharedSectionStructureFromCategory(args.data.category)) as unknown as
            | null
            | string
            | number
        | boolean
        | unknown[]
        | { [key: string]: unknown },
      tags: (args.data.tags || []).map((tag) => ({ tag })),
    },
    depth: 1,
    draft: true,
    overrideAccess: false,
    req: payloadReq,
  })) as SharedSection

  return toSharedSectionRecord(created)
}

export async function saveSharedSectionDraft(args: {
  auth: PayloadContext
  data: {
    category?: SharedSectionCategory
    description?: null | string
    id: number
    name?: string
    slug?: null | string
    structure?: ComposerSectionNode
    tags?: string[]
  }
}) {
  const payloadReq = await createLocalReq({ user: args.auth.realUser || undefined }, args.auth.payload)

  const updated = (await args.auth.payload.update({
    autosave: false,
    collection: 'shared-sections',
    data: {
      category: args.data.category,
      description: args.data.description,
      name: args.data.name?.trim(),
      slug: args.data.slug?.trim() || undefined,
      status: 'draft',
      structure: args.data.structure as
        | undefined
        | null
        | string
        | number
        | boolean
        | unknown[]
        | { [key: string]: unknown },
      tags: args.data.tags?.map((tag) => ({ tag })),
    },
    depth: 1,
    draft: true,
    id: args.data.id,
    overrideAccess: false,
    req: payloadReq,
  })) as unknown as SharedSection

  return toSharedSectionRecord(updated)
}

export async function publishSharedSection(args: {
  auth: PayloadContext
  data: {
    category?: SharedSectionCategory
    description?: null | string
    id: number
    name?: string
    slug?: null | string
    structure?: ComposerSectionNode
    tags?: string[]
  }
}) {
  const payloadReq = await createLocalReq({ user: args.auth.realUser || undefined }, args.auth.payload)

  const updated = (await args.auth.payload.update({
    autosave: false,
    collection: 'shared-sections',
    data: {
      _status: 'published',
      category: args.data.category,
      description: args.data.description,
      name: args.data.name?.trim(),
      slug: args.data.slug?.trim() || undefined,
      status: 'published',
      structure: args.data.structure as
        | undefined
        | null
        | string
        | number
        | boolean
        | unknown[]
        | { [key: string]: unknown },
      tags: args.data.tags?.map((tag) => ({ tag })),
    },
    depth: 1,
    draft: false,
    id: args.data.id,
    overrideAccess: false,
    req: payloadReq,
  })) as unknown as SharedSection

  return toSharedSectionRecord(updated)
}

export async function restoreSharedSectionVersion(args: {
  auth: PayloadContext
  sharedSectionId: number
  versionId: string
}) {
  const payloadReq = await createLocalReq({ user: args.auth.realUser || undefined }, args.auth.payload)
  const version = (await args.auth.payload.findVersionByID({
    collection: 'shared-sections',
    id: args.versionId,
    overrideAccess: false,
    req: payloadReq,
  })) as TypeWithVersion<SharedSection>

  if (Number(version.parent) !== args.sharedSectionId) {
    throw new Error('The selected version does not belong to this shared section.')
  }

  await args.auth.payload.restoreVersion({
    collection: 'shared-sections',
    draft: true,
    id: args.versionId,
    overrideAccess: false,
    req: payloadReq,
  })

  const restored = (await args.auth.payload.findByID({
    collection: 'shared-sections',
    depth: 1,
    draft: true,
    id: args.sharedSectionId,
    overrideAccess: false,
    req: payloadReq,
  })) as SharedSection

  return toSharedSectionRecord(restored)
}

export async function loadPublishedSharedSectionsByIds(args: {
  ids: number[]
  payload: Payload
}): Promise<Map<number, SharedSectionRecord>> {
  const ids = Array.from(new Set(args.ids.filter((id) => Number.isInteger(id) && id > 0)))

  if (!ids.length) {
    return new Map()
  }

  const result = await args.payload.find({
    collection: 'shared-sections',
    depth: 1,
    draft: false,
    limit: ids.length,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          id: {
            in: ids,
          },
        },
        {
          status: {
            equals: 'published',
          },
        },
      ],
    },
  })

  return new Map((result.docs as SharedSection[]).map((record) => {
    const normalized = toSharedSectionRecord(record)
    return [normalized.id, normalized]
  }))
}
